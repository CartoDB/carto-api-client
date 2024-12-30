import {TilesetSourceOptions} from '../sources/index.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {ModelSource} from '../models/model.js';
import {
  CategoryRequestOptions,
  CategoryResponse,
  FeaturesRequestOptions,
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
import {InvalidColumnError, getApplicableFilters} from '../utils.js';
import {Feature} from 'geojson';
import {applyFilters} from '../filters/Filter.js';
import {TileFormat} from '../constants.js';
import {SpatialFilter, Tile} from '../types.js';
import {aggregationFunctions} from '../operations/aggregation.js';
import {
  TileFeatureExtractOptions,
  tileFeatures,
} from '../filters/tileFeatures.js';
import {groupValuesByDateColumn} from '../operations/groupByDate.js';
import {scatterPlot} from '../operations/scatterPlot.js';
import {groupValuesByColumn} from '../operations/groupBy.js';
import {histogram} from '../operations/histogram.js';
import {applySorting} from '../operations/applySorting.js';

type LayerTilesetSourceOptions = Omit<TilesetSourceOptions, 'filters'>;

export type WidgetTilesetSourceResult = {widgetSource: WidgetTilesetSource};

/**
 * Source for Widget API requests on a data source defined by a tileset.
 *
 * Generally not intended to be constructed directly. Instead, call
 * {@link rasterSource}, which can be shared with map layers. Sources contain a
 * `widgetSource` property, for use by widget implementations.
 *
 * Example:
 *
 * ```javascript
 * import { rasterSource } from '@carto/api-client';
 *
 * const data = rasterSource({
 *   accessToken: '••••',
 *   connectionName: 'carto_dw',
 *   tableName: 'carto-demo-data.demo_rasters.my_raster_source'
 * });
 *
 * const { widgetSource } = await data;
 * ```
 */
export class WidgetTilesetSource extends WidgetBaseSource<
  LayerTilesetSourceOptions & WidgetBaseSourceProps
> {
  protected override getModelSource(owner: string): ModelSource {
    return {
      ...super._getModelSource(owner),
      type: 'raster',
      data: this.props.tableName,
    };
  }

  private _features: Feature[] = [];

  loadTiles({
    tiles,
    spatialFilter,
    uniqueIdProperty,
    options,
  }: {
    tiles: Tile[];
    spatialFilter: SpatialFilter;
    uniqueIdProperty?: string;
    options?: TileFeatureExtractOptions;
  }) {
    this._features = tileFeatures({
      tiles,
      options,
      spatialFilter,
      uniqueIdProperty, // TODO(api): Should this be a source/constructor property?
      tileFormat: TileFormat.MVT, // TODO(api): Should this be a source/constructor property?
      spatialDataColumn: this.props.geoColumn,
      spatialIndex: undefined, // TODO(api): Could determine from internal properties?
    }) as Feature[];
  }

  override async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    throw new Error('getFeatures not supported for tilesets');
  }

  async getFormula({
    // TODO(cleanup): Defaults should be shared among sources.
    column = '*',
    operation = 'count',
    joinOperation,
    filterOwner,
  }: FormulaRequestOptions): Promise<FormulaResponse> {
    if (operation === 'custom') {
      throw new Error('Custom aggregation not supported for tilesets');
    }

    if (!this._features.length) {
      return {value: null};
    }

    // Column is required except when operation is 'count'.
    if (column || operation !== 'count') {
      assertColumn(this._features, column);
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    if (filteredFeatures.length === 0 && operation !== 'count') {
      return {value: null};
    }

    const targetOperation = aggregationFunctions[operation];
    return {
      value: targetOperation(
        // TODO(types): Better types available?
        filteredFeatures as unknown as Record<string, unknown>[],
        column,
        joinOperation
      ),
    };
  }

  override async getHistogram({
    operation,
    ticks,
    column,
    joinOperation,
    filterOwner,
  }: HistogramRequestOptions): Promise<HistogramResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

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
    operation,
    operationColumn,
    joinOperation,
    filterOwner,
  }: CategoryRequestOptions): Promise<CategoryResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    // TODO(api): Are 'column' and 'operationColumn' required only for tilesets?
    assertColumn(this._features, column as string, operationColumn as string);

    const groups = groupValuesByColumn({
      data: filteredFeatures,
      // TODO(cleanup): Defaults should be shared among sources.
      valuesColumns: normalizeColumns(operationColumn || column),
      joinOperation,
      keysColumn: column,
      operation,
    });

    return groups || [];
  }

  override async getScatter({
    xAxisColumn,
    yAxisColumn,
    xAxisJoinOperation,
    yAxisJoinOperation,
    filterOwner,
  }: ScatterRequestOptions): Promise<ScatterResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    assertColumn(this._features, xAxisColumn, yAxisColumn);

    return scatterPlot({
      data: filteredFeatures,
      xAxisColumns: normalizeColumns(xAxisColumn),
      xAxisJoinOperation,
      yAxisColumns: normalizeColumns(yAxisColumn),
      yAxisJoinOperation,
    });
  }

  // TODO(bug): Different results compared to API! Needs sort?
  override async getTable(
    options: TableRequestOptions
  ): Promise<TableResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = options;
    const {
      columns,
      searchFilterColumn,
      searchFilterText,
      sortBy,
      sortDirection,
      sortByColumnType,
      offset = 0,
      limit = 10,
    } = params;

    if (!this._features.length) {
      return {rows: [], totalCount: 0};
    }

    // Filter.
    let filteredFeatures = this._getFilteredFeatures(filterOwner);

    // Search.
    // TODO(design): Could we get the same behavior by passing filters?
    if (searchFilterColumn && searchFilterText) {
      filteredFeatures = filteredFeatures.filter(
        (row) =>
          row[searchFilterColumn] &&
          String(row[searchFilterColumn])
            .toLowerCase()
            .includes(String(searchFilterText).toLowerCase())
      );
    }

    // Sort.
    // TODO(types): Mismatch in feature vs. record types.
    let rows = applySorting(filteredFeatures as any, {
      sortBy,
      sortByDirection: sortDirection,
      sortByColumnType,
    }) as unknown as Record<string, unknown>[];
    const totalCount = rows.length;

    // Offset and limit.
    rows = rows.slice(
      Math.min(offset, totalCount),
      Math.min(offset + limit, totalCount)
    );

    // Select columns.
    rows = rows.map((srcRow: Record<string, unknown>) => {
      const dstRow = {} as Record<string, unknown>;
      for (const column of columns) {
        dstRow[column] = srcRow[column];
      }
      return dstRow;
    });

    // TODO(types): Mismatch in feature vs. record types.
    return {rows, totalCount} as unknown as TableResponse;
  }

  override async getTimeSeries({
    column,
    stepSize,
    operation,
    operationColumn,
    joinOperation,
    filterOwner,
  }: TimeSeriesRequestOptions): Promise<TimeSeriesResponse> {
    if (!this._features.length) {
      // TODO(api): Is this at all the same response shape as the API returns?
      return [] as unknown as TimeSeriesResponse;
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    // TODO(api): Are 'column' and 'operationColumn' required only for tilesets?
    assertColumn(this._features, column as string, operationColumn as string);

    const groups = groupValuesByDateColumn({
      data: filteredFeatures,
      // TODO(cleanup): Defaults should be shared among sources.
      valuesColumns: normalizeColumns(operationColumn || column),
      keysColumn: column,
      groupType: stepSize,
      operation,
      joinOperation,
    });

    // @ts-expect-error TODO(api): Is this at all the same response shape as the API returns?
    return groups || [];
  }

  override async getRange({
    column,
    filterOwner,
  }: RangeRequestOptions): Promise<RangeResponse> {
    // TODO(api): Previously this case returned 'null' ... what do we prefer?
    if (!this._features.length) {
      return {min: -Infinity, max: Infinity};
    }

    assertColumn(this._features, column);

    const filteredFeatures = this._getFilteredFeatures(filterOwner);
    return {
      min: aggregationFunctions.min(filteredFeatures, column),
      max: aggregationFunctions.max(filteredFeatures, column),
    };
  }

  /****************************************************************************
   * INTERNAL
   */

  // TODO(types): Better return type available?
  private _getFilteredFeatures(
    filterOwner: string | undefined
  ): Record<string, unknown>[] {
    return applyFilters(
      this._features,
      getApplicableFilters(filterOwner, this.props.filters),
      this.props.filtersLogicalOperator || 'and'
    ) as unknown as Record<string, unknown>[];
  }
}

function assertColumn(
  features: Feature[],
  ...columnArgs: string[] | string[][]
) {
  // TODO(cleanup): Can drop support for multiple column shapes here?

  // Due to the multiple column shape, we normalise it as an array with normalizeColumns
  const columns = Array.from(new Set(columnArgs.map(normalizeColumns).flat()));

  const featureKeys = Object.keys(features[0]);

  const invalidColumns = columns.filter(
    (column) => !featureKeys.includes(column)
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
