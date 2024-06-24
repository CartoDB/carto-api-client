import {
  H3QuerySourceOptions,
  QuadbinQuerySourceOptions,
  VectorQuerySourceOptions,
} from '@deck.gl/carto';
import {MapType} from '../constants.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {Source} from '../types.js';

type LayerQuerySourceOptions =
  | VectorQuerySourceOptions
  | H3QuerySourceOptions
  | QuadbinQuerySourceOptions;

export class WidgetQuerySource extends WidgetBaseSource<
  LayerQuerySourceOptions & WidgetBaseSourceProps
> {
  protected override getSource(owner: string): Source {
    return {
      ...super.getSource(owner),
      type: MapType.QUERY,
      data: this.props.sqlQuery,
    };
  }
}
