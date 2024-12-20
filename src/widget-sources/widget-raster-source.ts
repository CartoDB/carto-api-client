import {RasterSourceOptions} from '../sources/index.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {ModelSource} from '../models/model.js';
import {FormulaRequestOptions, FormulaResponse} from './types.js';
import {Raster} from '../types.js';

type LayerRasterSourceOptions = Omit<RasterSourceOptions, 'filters'>;

export type WidgetRasterSourceResult = {widgetSource: WidgetRasterSource};

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
export class WidgetRasterSource extends WidgetBaseSource<
  LayerRasterSourceOptions & WidgetBaseSourceProps
> {
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

  _rasters: Raster[] = [];

  loadRasters(rasters: Raster[]) {
    this._rasters = rasters;
  }

  /****************************************************************************
   * FORMULA
   */

  /**
   * Returns a scalar numerical statistic over all matching data. Suitable
   * for 'headline' or 'scorecard' figures such as counts and sums.
   */
  async getFormula(options: FormulaRequestOptions): Promise<FormulaResponse> {
    // TODO: would really like to know what tiles are _pending_, not just what
    // tiles have fully loaded... otherwise the first request just ... finishes,
    // and the source can't push a response to the widget.
    console.log('getFormula', this._rasters);
    return {value: 123};
  }
}
