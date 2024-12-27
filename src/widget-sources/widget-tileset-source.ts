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
import {InvalidColumnError} from '../utils.js';
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
    column = '*',
    operation = 'count',
    joinOperation,
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

    const filteredFeatures = this._getFilteredFeatures();

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
    column,
    ticks,
    joinOperation,
  }: HistogramRequestOptions): Promise<HistogramResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures();

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
  }: CategoryRequestOptions): Promise<CategoryResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures();

    // TODO(api): Are 'column' and 'operationColumn' required only for tilesets?
    assertColumn(this._features, column as string, operationColumn as string);

    const groups = groupValuesByColumn({
      data: filteredFeatures,
      valuesColumns: normalizeColumns(operationColumn as string),
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
  }: ScatterRequestOptions): Promise<ScatterResponse> {
    if (!this._features.length) {
      return [];
    }

    const filteredFeatures = this._getFilteredFeatures();

    assertColumn(this._features, xAxisColumn, yAxisColumn);

    return scatterPlot({
      data: filteredFeatures,
      xAxisColumns: normalizeColumns(xAxisColumn),
      xAxisJoinOperation,
      yAxisColumns: normalizeColumns(yAxisColumn),
      yAxisJoinOperation,
    });
  }

  // TODO(impl): Implement.
  // override async getTable({
  //   searchFilterColumn,
  //   searchFilterText,
  //   sortBy,
  //   sortByDirection = 'asc',
  //   sortByColumnType,
  //   offset,
  //   limit
  //   // page and rowsPerPage are optional and only used for pagination
  //   page = undefined,
  //   rowsPerPage = undefined,
  // }: TableRequestOptions): Promise<TableResponse> {
  //   const {filterOwner, spatialFilter, abortController, ...params} = options;
  //   const {columns, sortBy, sortDirection, offset = 0, limit = 10} = params;

  //   if (!this._features.length) {
  //     return { rows: [], totalCount, 0, hasData: false };
  //   }

  //     let filteredFeatures = this._getFilteredFeatures();

  //     if (searchFilterColumn && searchFilterText) {
  //       filteredFeatures = filteredFeatures.filter(
  //         (row) =>
  //           row[searchFilterColumn] &&
  //           String(row[searchFilterColumn])
  //             .toLowerCase()
  //             .includes(String(searchFilterText).toLowerCase())
  //       );
  //     }

  //     // TODO(types): Are in/out really Features here? Or just dicts?
  //     let rows = applySorting(filteredFeatures, {
  //       sortBy,
  //       sortByDirection,
  //       sortByColumnType,
  //     });
  //     const totalCount = rows.length;
  //   const hasData = true;

  //   if (page !== undefined && rowsPerPage !== undefined) {
  //     rows = rows.slice(
  //       Math.min(rowsPerPage * Math.max(0, page), totalCount),
  //       Math.min(rowsPerPage * Math.max(1, page + 1), totalCount)
  //     );
  //   }

  //   return {rows, totalCount, hasData};
  // }

  override async getTimeSeries({
    column,
    stepSize,
    operation,
    operationColumn,
    joinOperation,
  }: TimeSeriesRequestOptions): Promise<TimeSeriesResponse> {
    if (!this._features.length) {
      // TODO(api): Is this at all the same response shape as the API returns?
      return [] as unknown as TimeSeriesResponse;
    }

    const filteredFeatures = this._getFilteredFeatures();

    // TODO(api): Are 'column' and 'operationColumn' required only for tilesets?
    assertColumn(this._features, operationColumn as string, column as string);

    const groups = groupValuesByDateColumn({
      data: filteredFeatures,
      valuesColumns: normalizeColumns(operationColumn as string),
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
  }: RangeRequestOptions): Promise<RangeResponse> {
    // TODO(api): Previously this case returned 'null' ... what do we prefer?
    if (!this._features.length) {
      return {min: -Infinity, max: Infinity};
    }

    assertColumn(this._features, column);

    const filteredFeatures = this._getFilteredFeatures();
    return {
      min: aggregationFunctions.min(filteredFeatures, column),
      max: aggregationFunctions.max(filteredFeatures, column),
    };
  }

  /****************************************************************************
   * INTERNAL
   */

  // TODO(types): Better return type available?
  private _getFilteredFeatures(): Record<string, unknown>[] {
    return applyFilters(
      this._features,
      this.props.filters || {},
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
