import {
  H3QuerySourceOptions,
  QuadbinQuerySourceOptions,
  VectorQuerySourceOptions,
} from '@deck.gl/carto';
import {MapType} from '../constants.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {ModelSource} from '../models/model.js';

type LayerQuerySourceOptions =
  | Omit<VectorQuerySourceOptions, 'filters'>
  | Omit<H3QuerySourceOptions, 'filters'>
  | Omit<QuadbinQuerySourceOptions, 'filters'>;

export class WidgetQuerySource extends WidgetBaseSource<
  LayerQuerySourceOptions & WidgetBaseSourceProps
> {
  protected override getModelSource(owner: string): ModelSource {
    return {
      ...super._getModelSource(owner),
      type: MapType.QUERY,
      data: this.props.sqlQuery,
      queryParameters: this.props.queryParameters,
    };
  }
}
