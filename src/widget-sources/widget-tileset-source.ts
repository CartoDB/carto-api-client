import {TilesetSourceOptions} from '../sources/index.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {ModelSource} from '../models/model.js';
import {
  FeaturesRequestOptions,
  FeaturesResponse,
  FormulaRequestOptions,
  FormulaResponse,
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

  async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    throw new Error('getFeatures not supported for tilesets');
  }

  async getFormula({
    column = '*',
    operation = 'count',
    joinOperation,
  }: FormulaRequestOptions): Promise<FormulaResponse> {
    let result: FormulaResponse = {value: null};

    if (this._features) {
      if (operation === 'custom') {
        throw new Error('Custom aggregation not supported for tilesets');
      }

      // Column is required except when operation is 'count'.
      if (column || operation !== 'count') {
        assertColumn(this._features, column);
      }

      const filteredFeatures = this._getFilteredFeatures();

      if (filteredFeatures.length !== 0 || operation === 'count') {
        const targetOperation = aggregationFunctions[operation];
        result = {
          value: targetOperation(
            // TODO(types): Better types available?
            filteredFeatures as unknown as Record<string, unknown>[],
            column,
            joinOperation
          ),
        };
      }
    }

    return result;
  }

  // // TODO: API
  // getHistogram({
  //   filters,
  //   filtersLogicalOperator,
  //   operation,
  //   column,
  //   ticks,
  //   joinOperation,
  // }) {
  //   let result = null;

  //   if (currentFeatures) {
  //     const filteredFeatures = getFilteredFeatures(
  //       filters,
  //       filtersLogicalOperator
  //     );

  //     assertColumn(column);

  //     result = histogram({
  //       data: filteredFeatures,
  //       valuesColumns: normalizeColumns(column),
  //       joinOperation,
  //       ticks,
  //       operation,
  //     });
  //   }

  //   return result;
  // }

  // // TODO: API
  // getCategories({
  //   filters,
  //   filtersLogicalOperator,
  //   operation,
  //   column,
  //   operationColumn,
  //   joinOperation,
  // }) {
  //   let result = null;

  //   if (currentFeatures) {
  //     const filteredFeatures = getFilteredFeatures(
  //       filters,
  //       filtersLogicalOperator
  //     );

  //     assertColumn(column, operationColumn);

  //     const groups = groupValuesByColumn({
  //       data: filteredFeatures,
  //       valuesColumns: normalizeColumns(operationColumn),
  //       joinOperation,
  //       keysColumn: column,
  //       operation,
  //     });

  //     result = groups || [];
  //   }

  //   return result;
  // }

  // // TODO: API
  // getScatterPlot({
  //   filters,
  //   filtersLogicalOperator,
  //   xAxisColumn,
  //   yAxisColumn,
  //   xAxisJoinOperation,
  //   yAxisJoinOperation,
  // }) {
  //   let result = [];
  //   if (currentFeatures) {
  //     const filteredFeatures = getFilteredFeatures(
  //       filters,
  //       filtersLogicalOperator
  //     );

  //     assertColumn(xAxisColumn, yAxisColumn);

  //     result = scatterPlot({
  //       data: filteredFeatures,
  //       xAxisColumns: normalizeColumns(xAxisColumn),
  //       xAxisJoinOperation,
  //       yAxisColumns: normalizeColumns(yAxisColumn),
  //       yAxisJoinOperation,
  //     });
  //   }

  //   return result;
  // }

  // // TODO: API
  // getTimeSeries({
  //   filters,
  //   filtersLogicalOperator,
  //   column,
  //   stepSize,
  //   operation,
  //   operationColumn,
  //   joinOperation,
  // }) {
  //   let result = [];

  //   if (currentFeatures) {
  //     const filteredFeatures = getFilteredFeatures(
  //       filters,
  //       filtersLogicalOperator
  //     );

  //     assertColumn(operationColumn, column);

  //     const groups = groupValuesByDateColumn({
  //       data: filteredFeatures,
  //       valuesColumns: normalizeColumns(operationColumn),
  //       keysColumn: column,
  //       groupType: stepSize,
  //       operation,
  //       joinOperation,
  //     });

  //     result = groups || [];
  //   }

  //   return result;
  // }

  // // TODO: API
  // getRange({filters, filtersLogicalOperator, column}) {
  //   let result = null;

  //   if (currentFeatures) {
  //     const filteredFeatures = getFilteredFeatures(
  //       filters,
  //       filtersLogicalOperator
  //     );

  //     assertColumn(column);

  //     result = {
  //       min: aggregationFunctions.min(filteredFeatures, column),
  //       max: aggregationFunctions.max(filteredFeatures, column),
  //     };
  //   }

  //   return result;
  // }

  /****************************************************************************
   * INTERNAL
   */

  private _getFilteredFeatures() {
    return applyFilters(
      this._features,
      this.props.filters || {},
      this.props.filtersLogicalOperator || 'and'
    );
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
