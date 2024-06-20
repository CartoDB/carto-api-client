import {
  H3TableSourceOptions,
  QuadbinTableSourceOptions,
  VectorTableSourceOptions,
} from '@deck.gl/carto';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';
import {MAP_TYPES} from '../constants.js';
import {Source} from '../types.js';

type LayerTableSourceOptions =
  | VectorTableSourceOptions
  | H3TableSourceOptions
  | QuadbinTableSourceOptions;

export class WidgetTableSource extends WidgetBaseSource<
  LayerTableSourceOptions & WidgetBaseSourceProps
> {
  protected override getSource(owner: string): Source {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.TABLE,
      data: this.props.tableName,
    };
  }
}
