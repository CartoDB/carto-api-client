import {
  H3TableSourceOptions,
  QuadbinTableSourceOptions,
  VectorTableSourceOptions,
} from '@deck.gl/carto';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {MapType} from '../constants-internal.js';
import {ModelSource} from '../models/model.js';

type LayerTableSourceOptions =
  | Omit<VectorTableSourceOptions, 'filters'>
  | Omit<H3TableSourceOptions, 'filters'>
  | Omit<QuadbinTableSourceOptions, 'filters'>;

export class WidgetTableSource extends WidgetBaseSource<
  LayerTableSourceOptions & WidgetBaseSourceProps
> {
  protected override getModelSource(owner: string): ModelSource {
    return {
      ...super._getModelSource(owner),
      type: MapType.TABLE,
      data: this.props.tableName,
    };
  }
}
