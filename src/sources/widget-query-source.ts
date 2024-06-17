import {
  H3QuerySourceOptions,
  QuadbinQuerySourceOptions,
  VectorQuerySourceOptions,
} from '@deck.gl/carto';
import {$TODO} from '../types-internal.js';
import {MAP_TYPES} from '../vendor/carto-constants.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';

type LayerQuerySourceOptions =
  | VectorQuerySourceOptions
  | H3QuerySourceOptions
  | QuadbinQuerySourceOptions;

export class WidgetQuerySource extends WidgetBaseSource<
  LayerQuerySourceOptions & WidgetBaseSourceProps
> {
  protected override getSource(owner: string): $TODO {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.QUERY,
      data: this.props.sqlQuery,
    };
  }
}
