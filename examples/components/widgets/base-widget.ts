import {LitElement} from 'lit';
import {WidgetSource} from '@carto/api-client';
import {MapViewState} from '@deck.gl/core';

import {WIDGET_BASE_CSS} from './styles.js';

export abstract class BaseWidget extends LitElement {
  static override styles = WIDGET_BASE_CSS;

  // References:
  // - https://lit.dev/docs/components/properties/#declare
  // - https://lit.dev/docs/components/properties/#internal-reactive-state
  static get properties() {
    return {
      header: {type: String},
      caption: {type: String},
      data: {type: Object, attribute: false},
      viewState: {type: Object, attribute: false},
    };
  }

  declare header: string;
  declare caption: string;
  declare data: Promise<{widgetSource: WidgetSource}> | null;
  declare viewState: MapViewState | null;

  protected readonly _widgetId = crypto.randomUUID();

  constructor() {
    super();

    this.header = 'Untitled';
    this.caption = '';
    this.data = null;
    this.viewState = null;
  }
}
