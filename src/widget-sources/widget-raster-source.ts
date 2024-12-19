import {RasterSourceOptions} from '../sources/index.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {ModelSource} from '../models/model.js';
import {
  FormulaRequestOptions,
  FormulaResponse,
  LocalWidgetSource,
} from './types.js';

type LayerRasterSourceOptions = Omit<RasterSourceOptions, 'filters'>;

export type WidgetRasterSourceResult = {widgetSource: WidgetRasterSource};

type NumericProps = Record<
  string,
  {value: number[] | Float32Array | Float64Array}
>;
type Properties = Record<string, string | number | boolean | null>;

type Raster = {
  /** Raster tiles are square, with 'blockSize' width and height in pixels. */
  blockSize: number;
  cells: {
    numericProps: NumericProps;
    properties: Properties[];
  };
};

/**
 * Source for Widget API requests on a data source defined by a raster.
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
export class WidgetRasterSource
  extends WidgetBaseSource<LayerRasterSourceOptions & WidgetBaseSourceProps>
  implements LocalWidgetSource<Raster>
{
  protected override getModelSource(owner: string): ModelSource {
    return {
      ...super._getModelSource(owner),
      type: 'raster',
      data: this.props.tableName,
    };
  }

  /****************************************************************************
   * LOCAL SYNC
   */

  tiles = new Set<Raster>();

  onTileLoad(tile: Raster) {
    this.tiles.add(tile);
  }

  onTileUnload(tile: Raster) {
    this.tiles.delete(tile);
  }

  destroy() {
    this.tiles.clear();
  }

  /****************************************************************************
   * FORMULA
   */

  /**
   * Returns a scalar numerical statistic over all matching data. Suitable
   * for 'headline' or 'scorecard' figures such as counts and sums.
   */
  async getFormula(options: FormulaRequestOptions): Promise<FormulaResponse> {
    return {value: 123};
  }
}
