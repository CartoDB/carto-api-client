import {
  H3TableSourceOptions,
  QuadbinTableSourceOptions,
  VectorTableSourceOptions,
} from '@deck.gl/carto';
import {$TODO} from '../types-internal.js';
import {MAP_TYPES} from '../vendor/carto-constants.js';
import {WidgetBaseSource, WidgetBaseSourceProps} from './widget-base-source.js';

type LayerTableSourceOptions =
  | VectorTableSourceOptions
  | H3TableSourceOptions
  | QuadbinTableSourceOptions;

export class WidgetTableSource extends WidgetBaseSource<
  LayerTableSourceOptions & WidgetBaseSourceProps
> {
  protected override getSource(owner: string): $TODO {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.TABLE,
      data: this.props.tableName,
    };
  }
}
