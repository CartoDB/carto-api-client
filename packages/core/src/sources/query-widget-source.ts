import {VectorQuerySourceOptions} from '@deck.gl/carto';
import {$TODO} from '../types-internal.js';
import {MAP_TYPES} from '../vendor/carto-constants.js';
import {BaseWidgetSource, BaseWidgetSourceProps} from './base-widget-source.js';

export class QueryWidgetSource extends BaseWidgetSource<
  VectorQuerySourceOptions & BaseWidgetSourceProps
> {
  protected override getSource(owner: string): $TODO {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.QUERY,
      data: this.props.sqlQuery,
    };
  }
}
