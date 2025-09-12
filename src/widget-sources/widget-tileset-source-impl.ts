/* eslint-disable @typescript-eslint/require-await */
import type {
  AggregationsRequestOptions,
  AggregationsResponse,
  CategoryRequestOptions,
  CategoryResponse,
  ExtentResponse,
  FeaturesResponse,
  FormulaRequestOptions,
  FormulaResponse,
  HistogramRequestOptions,
  HistogramResponse,
  RangeRequestOptions,
  RangeResponse,
  ScatterRequestOptions,
  ScatterResponse,
  TableRequestOptions,
  TableResponse,
  TimeSeriesRequestOptions,
  TimeSeriesResponse,
} from './types.js';
import {InvalidColumnError, assert, assignOptional} from '../utils.js';
import type {Filter, SpatialFilter, Tile} from '../types.js';

import {
  type TileFeatureExtractOptions,
  applyFilters,
  geojsonFeatures,
  tileFeatures,
} from '../filters/index.js';
import {
  aggregationFunctions,
  applySorting,
  groupValuesByColumn,
  groupValuesByDateColumn,
  histogram,
  scatterPlot,
} from '../operations/index.js';
import type {FeatureData} from '../types-internal.js';
import type {FeatureCollection} from 'geojson';
import {WidgetSource} from './widget-source.js';
import {booleanEqual} from '@turf/boolean-equal';
import type {WidgetTilesetSourceProps} from './widget-tileset-source.js';
import {getApplicableFilters} from '../filters.js';
import {AggregationTypes} from '../constants.js';
import {OTHERS_CATEGORY_NAME} from './constants.js';

// TODO(cleanup): Parameter defaults in source functions and widget API calls are
// currently duplicated and possibly inconsistent. Consider consolidating and
// operating on Required<T> objects. See:
// https://github.com/CartoDB/carto-api-client/issues/39

/**
 * Local (in-memory) implementation of tileset widget calculations. This class
 * may be instantiated by {@link WidgetTilesetSource} in a Web Worker when
 * supported, or on the main thread.
 */
export class WidgetTilesetSourceImpl extends WidgetSource<WidgetTilesetSourceProps> {
  private _tiles: Tile[] = [];
  private _features: FeatureData[] = [];
  private _tileFeatureExtractOptions: TileFeatureExtractOptions = {};
  private _tileFeatureExtractPreviousInputs: {spatialFilter?: SpatialFilter} =
    {};

  /**
   * Loads features as a list of tiles (typically provided by deck.gl).
   * After tiles are loaded, {@link extractTileFeatures} must be called
   * before computing statistics on the tiles.
   */
  loadTiles(tiles: unknown[]) {
    this._tiles = tiles as Tile[];
    this._features.length = 0;
  }

  /** Configures options used to extract features from tiles. */
  setTileFeatureExtractOptions(options: TileFeatureExtractOptions) {
    this._tileFeatureExtractOptions = options;
    this._features.length = 0;
  }

  protected _extractTileFeatures(spatialFilter?: SpatialFilter) {
    // When spatial filter has not changed, don't redo extraction. If tiles or
    // tile extract options change, features will have been cleared already.
    const prevInputs = this._tileFeatureExtractPreviousInputs;
    if (
      this._features.length &&
      spatialFilterEquals(prevInputs.spatialFilter, spatialFilter)
    ) {
      return;
    }

    this._features = tileFeatures({
      ...assignOptional({}, this.props, this._tileFeatureExtractOptions),
      tiles: this._tiles,
      spatialFilter,
    });

    prevInputs.spatialFilter = spatialFilter;
  }

  /**
   * Loads features as GeoJSON (used for testing).
   * @experimental
   * @internal Not for public use. Spatial filters in other method calls will be ignored.
   */
  loadGeoJSON({
    geojson,
    spatialFilter,
  }: {
    geojson: FeatureCollection;
    spatialFilter: SpatialFilter;
  }) {
    this._features = geojsonFeatures({
      geojson,
      spatialFilter,
      ...this._tileFeatureExtractOptions,
    });
    this._tileFeatureExtractPreviousInputs.spatialFilter = spatialFilter;
  }

  override async getFeatures(): Promise<FeaturesResponse> {
    throw new Error('getFeatures not supported for tilesets');
  }

  async getFormula({
    column = '*',
    operation = AggregationTypes.Count,
    joinOperation,
    filters,
    filterOwner,
    spatialFilter,
  }: FormulaRequestOptions): Promise<FormulaResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (filteredFeatures.length === 0 && operation !== AggregationTypes.Count) {
      return {value: null};
    }

    if (operation === AggregationTypes.Custom) {
      throw new Error('Custom aggregation not supported for tilesets');
    }

    // Column is required except when operation is 'count'.
    if ((column && column !== '*') || operation !== AggregationTypes.Count) {
      assertColumn(this._features, column);
    }

    const targetOperation = aggregationFunctions[operation];
    assert(targetOperation, `Unsupported aggregation operation: ${operation}`);

    return {
      value: targetOperation(filteredFeatures, column, joinOperation),
    };
  }

  override async getHistogram({
    operation = AggregationTypes.Count,
    ticks,
    column,
    joinOperation,
    filters,
    filterOwner,
    spatialFilter,
  }: HistogramRequestOptions): Promise<HistogramResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!this._features.length) {
      return [];
    }

    assertColumn(this._features, column);

    return histogram({
      data: filteredFeatures,
      valuesColumns: normalizeColumns(column),
      joinOperation,
      ticks,
      operation,
    });
  }

  override async getCategories({
    column,
    operation = AggregationTypes.Count,
    operationColumn,
    joinOperation,
    filters,
    filterOwner,
    spatialFilter,
    othersThreshold,
    orderBy = 'frequency_desc',
    rawResult,
  }: CategoryRequestOptions): Promise<CategoryResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!filteredFeatures.length) {
      return [];
    }

    assertColumn(this._features, column, operationColumn as string);

    const result = groupValuesByColumn({
      data: filteredFeatures,
      valuesColumns: normalizeColumns(operationColumn || column),
      joinOperation,
      keysColumn: column,
      operation,
      othersThreshold,
      orderBy,
    });

    if (rawResult) {
      return result as unknown as CategoryResponse;
    }

    if (!othersThreshold) {
      return result?.rows || [];
    }

    return [
      ...(result?.rows || []),
      {name: OTHERS_CATEGORY_NAME, value: result?.metadata?.others as number},
    ];
  }

  override async getScatter({
    xAxisColumn,
    yAxisColumn,
    xAxisJoinOperation,
    yAxisJoinOperation,
    filters,
    filterOwner,
    spatialFilter,
  }: ScatterRequestOptions): Promise<ScatterResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!filteredFeatures.length) {
      return [];
    }

    assertColumn(this._features, xAxisColumn, yAxisColumn);

    return scatterPlot({
      data: filteredFeatures,
      xAxisColumns: normalizeColumns(xAxisColumn),
      xAxisJoinOperation,
      yAxisColumns: normalizeColumns(yAxisColumn),
      yAxisJoinOperation,
    });
  }

  override async getTable({
    columns,
    searchFilterColumn,
    searchFilterText,
    sortBy,
    sortDirection,
    sortByColumnType,
    offset = 0,
    limit = 10,
    filters,
    filterOwner,
    spatialFilter,
  }: TableRequestOptions): Promise<TableResponse> {
    // Filter.
    let filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!filteredFeatures.length) {
      return {rows: [], totalCount: 0};
    }

    // Search.
    // TODO(v0.6): Remove "searchFilterText" and "searchFilterColumn".
    if (searchFilterColumn && searchFilterText) {
      console.warn(
        'WidgetTilesetSource: "searchFilterText" is deprecated, use "filters" and FilterType.STRING_SEARCH instead.'
      );
      filteredFeatures = filteredFeatures.filter(
        (row) =>
          row[searchFilterColumn] &&
          String(row[searchFilterColumn] as unknown)
            .toLowerCase()
            .includes(String(searchFilterText).toLowerCase())
      );
    }

    // Sort.
    let rows = applySorting(filteredFeatures, {
      sortBy,
      sortByDirection: sortDirection,
      sortByColumnType,
    });
    const totalCount = rows.length;

    // Offset and limit.
    rows = rows.slice(
      Math.min(offset, totalCount),
      Math.min(offset + limit, totalCount)
    );

    // Select columns.
    rows = rows.map((srcRow: FeatureData) => {
      const dstRow: FeatureData = {};
      for (const column of columns) {
        dstRow[column] = srcRow[column];
      }
      return dstRow;
    });

    return {rows, totalCount} as TableResponse;
  }

  override async getTimeSeries({
    column,
    stepSize,
    operation,
    operationColumn,
    joinOperation,
    filters,
    filterOwner,
    spatialFilter,
  }: TimeSeriesRequestOptions): Promise<TimeSeriesResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!filteredFeatures.length) {
      return {rows: []};
    }

    assertColumn(this._features, column, operationColumn as string);
    assert(
      operation !== 'custom',
      'Custom operation not supported for tilesets'
    );

    const rows =
      groupValuesByDateColumn({
        data: filteredFeatures,
        valuesColumns: normalizeColumns(operationColumn || column),
        keysColumn: column,
        groupType: stepSize,
        operation,
        joinOperation,
      }) || [];

    return {rows};
  }

  override async getRange({
    column,
    filters,
    filterOwner,
    spatialFilter,
  }: RangeRequestOptions): Promise<RangeResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!this._features.length) {
      // TODO: Is this the only nullable response in the Widgets API? If so,
      // can we do something more consistent?
      return null;
    }

    assertColumn(this._features, column);

    return {
      min: aggregationFunctions.min(filteredFeatures, column),
      max: aggregationFunctions.max(filteredFeatures, column),
    };
  }

  async getAggregations({
    aggregations,
    filters,
    filterOwner,
    spatialFilter,
  }: AggregationsRequestOptions): Promise<AggregationsResponse> {
    const filteredFeatures = this._getFilteredFeatures(
      spatialFilter,
      filters,
      filterOwner
    );

    if (!this._features.length) {
      return {rows: []};
    }

    // SQL aggregations require remote execution, and are not supported for tilesets.
    assert(
      typeof aggregations !== 'string',
      'Unsupported tileset SQL aggregation'
    );

    // Handle array-based aggregations
    const result: Record<string, number> = {};
    const usedAliases = new Set<string>();

    for (const {column, operation, alias} of aggregations) {
      // Column is required except when operation is 'count'.
      if ((column && column !== '*') || operation !== AggregationTypes.Count) {
        assertColumn(this._features, column);
      }

      const aliasKey = alias.toLowerCase();
      assert(!usedAliases.has(aliasKey), `Duplicate alias: ${aliasKey}`);
      usedAliases.add(aliasKey);

      const targetOperation = aggregationFunctions[operation];
      assert(targetOperation, `Unsupported operation: ${operation}`);

      result[alias] = targetOperation(filteredFeatures, column);
    }

    return {rows: [result]};
  }

  /** @experimental */
  async getExtent(): Promise<ExtentResponse> {
    return Promise.reject(new Error('not implemented'));
  }

  /****************************************************************************
   * INTERNAL
   */

  private _getFilteredFeatures(
    spatialFilter?: SpatialFilter,
    filters?: Record<string, Filter>,
    filterOwner?: string
  ): FeatureData[] {
    this._extractTileFeatures(spatialFilter);
    return applyFilters(
      this._features,
      getApplicableFilters(filterOwner, filters || this.props.filters),
      this.props.filtersLogicalOperator || 'and'
    );
  }
}

function assertColumn(
  features: FeatureData[],
  ...columnArgs: string[] | string[][]
) {
  // Due to the multiple column shape, we normalise it as an array with normalizeColumns
  const columns = Array.from(new Set(columnArgs.map(normalizeColumns).flat()));

  const featureKeys = Object.keys(features[0]);

  // For backward compatibility, '' should pass column validation. For example,
  // operation='count',operationColumn='' is accepted.
  const invalidColumns = columns.filter(
    (column) => column && !featureKeys.includes(column)
  );

  if (invalidColumns.length) {
    throw new InvalidColumnError(
      `Missing column(s): ${invalidColumns.join(', ')}`
    );
  }
}

function normalizeColumns(columns: string | string[]): string[] {
  return Array.isArray(columns)
    ? columns
    : typeof columns === 'string'
      ? [columns]
      : [];
}

function spatialFilterEquals(a?: SpatialFilter, b?: SpatialFilter) {
  if (a === b) return true;
  if (!a || !b) return false;
  return booleanEqual(a, b);
}
