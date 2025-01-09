import {TilesetSourceOptions} from '../sources/index.js';
import type {ModelSource} from '../models/index.js';
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
import {TileFormat} from '../constants.js';
import {SpatialFilter, Tile} from '../types.js';
import {
  TileFeatureExtractOptions,
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
import {FeatureData} from '../types-internal.js';
import {FeatureCollection} from 'geojson';
import {SpatialDataType} from '../sources/types.js';
import {WidgetSource, WidgetSourceProps} from './widget-source.js';

// TODO(cleanup): Parameter defaults in source functions and widget API calls are
// currently duplicated and possibly inconsistent. Consider consolidating and
// operating on Required<T> objects. See:
// https://github.com/CartoDB/carto-api-client/issues/39

export type WidgetTilesetSourceProps = WidgetSourceProps &
  Omit<TilesetSourceOptions, 'filters'> & {
    tileFormat: TileFormat;
    spatialDataType: SpatialDataType;
  };

export type WidgetTilesetSourceResult = {widgetSource: WidgetTilesetSource};

/**
 * Source for Widget API requests on a data source defined by a tileset.
 *
 * Generally not intended to be constructed directly. Instead, call
 * {@link vectorTilesetSource}, {@link h3TilesetSource}, or {@link quadbinTilesetSource},
 * which can be shared with map layers. Sources contain a `widgetSource`
 * property, for use by widget implementations.
 *
 * Example:
 *
 * ```javascript
 * import { vectorTilesetSource } from '@carto/api-client';
 *
 * const data = vectorTilesetSource({
 *   accessToken: '••••',
 *   connectionName: 'carto_dw',
 *   tableName: 'carto-demo-data.demo_rasters.my_tileset_source'
 * });
 *
 * const { widgetSource } = await data;
 * ```
 */
export class WidgetTilesetSource extends WidgetSource<WidgetTilesetSourceProps> {
  private _features: FeatureData[] = [];

  protected override getModelSource(owner: string): ModelSource {
    return {
      ...super._getModelSource(owner),
      type: 'tileset',
      data: this.props.tableName,
    };
  }

  /** Loads features as a list of tiles (typically provided by deck.gl). */
  loadTiles({
    tiles,
    spatialFilter,
    uniqueIdProperty,
    options,
  }: {
    tiles: Tile[];
    spatialFilter: SpatialFilter;
    // TODO(cleanup): As an optional property, 'uniqueIdProperty' will be easy to forget.
    // Would it be better to configure it on the source function, rather than separately
    // on the layer and in 'loadTiles()'?
    uniqueIdProperty?: string;
    options?: TileFeatureExtractOptions;
  }) {
    this._features = tileFeatures({
      tiles,
      options,
      spatialFilter,
      uniqueIdProperty,
      tileFormat: this.props.tileFormat,
      spatialDataColumn: this.props.spatialDataColumn,
      spatialDataType: this.props.spatialDataType,
    });
  }

  /** Loads features as GeoJSON (used for testing). */
  loadGeoJSON({
    geojson,
    spatialFilter,
    uniqueIdProperty,
  }: {
    geojson: FeatureCollection;
    spatialFilter: SpatialFilter;
    uniqueIdProperty?: string;
  }) {
    this._features = geojsonFeatures({
      geojson,
      spatialFilter,
      uniqueIdProperty,
    });
  }

  override async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    throw new Error('getFeatures not supported for tilesets');
  }

  async getFormula({
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
    if ((column && column !== '*') || operation !== 'count') {
      assertColumn(this._features, column);
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    if (filteredFeatures.length === 0 && operation !== 'count') {
      return {value: null};
    }

    const targetOperation = aggregationFunctions[operation];
    return {
      value: targetOperation(
        filteredFeatures as FeatureData[],
        column,
        joinOperation
      ),
    };
  }

  override async getHistogram({
    operation = 'count',
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
    operation = 'count',
    operationColumn,
    joinOperation,
    filterOwner,
  }: CategoryRequestOptions): Promise<CategoryResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    assertColumn(this._features, column as string, operationColumn as string);

    const groups = groupValuesByColumn({
      data: filteredFeatures,
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
    // TODO: Could we get the same behavior by applying filters in loadTiles()?
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
    filterOwner,
  }: TimeSeriesRequestOptions): Promise<TimeSeriesResponse> {
    if (!this._features.length) {
      return {rows: []};
    }

    const filteredFeatures = this._getFilteredFeatures(filterOwner);

    assertColumn(this._features, column as string, operationColumn as string);

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
    filterOwner,
  }: RangeRequestOptions): Promise<RangeResponse> {
    if (!this._features.length) {
      // TODO: Is this the only nullable response in the Widgets API? If so,
      // can we do something more consistent?
      return null;
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

  private _getFilteredFeatures(filterOwner: string | undefined): FeatureData[] {
    return applyFilters(
      this._features,
      getApplicableFilters(filterOwner, this.props.filters),
      this.props.filtersLogicalOperator || 'and'
    );
  }
}

function assertColumn(
  features: FeatureData[],
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
