import {
  H3TableSourceOptions,
  QuadbinTableSourceOptions,
  VectorTableSourceOptions,
} from '../sources/index.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {ModelSource} from '../models/model.js';

type LayerTableSourceOptions =
  | Omit<VectorTableSourceOptions, 'filters'>
  | Omit<H3TableSourceOptions, 'filters'>
  | Omit<QuadbinTableSourceOptions, 'filters'>;

export type WidgetTableSourceResult = {widgetSource: WidgetTableSource};

/**
 * Source for Widget API requests on a data source defined as a table.
 *
 * Generally not intended to be constructed directly. Instead, call
 * {@link vectorTableSource}, {@link h3TableSource}, or {@link quadbinTableSource},
 * which can be shared with map layers. Sources contain a `widgetSource` property,
 * for use by widget implementations.
 *
 * Example:
 *
 * ```javascript
 * import { vectorTableSource } from '@carto/api-client';
 *
 * const data = vectorTableSource({
 *   accessToken: '••••',
 *   connectionName: 'carto_dw',
 *   tableName: 'carto-demo-data.demo_tables.retail_stores'
 * });
 *
 * const { widgetSource } = await data;
 * ```
 */
export class WidgetTableSource extends WidgetBaseSource<
  LayerTableSourceOptions & WidgetBaseSourceProps
> {
  protected override getModelSource(owner: string): ModelSource {
    return {
      ...super._getModelSource(owner),
      type: 'table',
      data: this.props.tableName,
    };
  }
}
