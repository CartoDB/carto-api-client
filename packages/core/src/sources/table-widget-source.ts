import {VectorTableSourceOptions} from '@deck.gl/carto';
import {$TODO} from '../types-internal.js';
import {MAP_TYPES} from '../vendor/carto-constants.js';
import {BaseWidgetSource, BaseWidgetSourceProps} from './base-widget-source.js';

export class TableWidgetSource extends BaseWidgetSource<
  VectorTableSourceOptions & BaseWidgetSourceProps
> {
  protected override getSource(owner: string): $TODO {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.TABLE,
      data: this.props.tableName,
    };
  }
}
