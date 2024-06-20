import {LitElement} from 'lit';
import {SpatialFilter, WidgetSource} from '@carto/api-client';
import {MapViewState, WebMercatorViewport} from '@deck.gl/core';

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
  declare spatialFilter: GeoJSON.Geometry | null;

  protected readonly _widgetId = crypto.randomUUID();

  constructor() {
    super();

    this.header = 'Untitled';
    this.caption = '';
    this.data = null;
    this.viewState = null;
    this.spatialFilter = null;
  }

  getSpatialFilterOrViewState(): SpatialFilter | undefined {
    if (this.spatialFilter) {
      return this.spatialFilter;
    }

    if (this.viewState) {
      const viewport = new WebMercatorViewport(this.viewState);
      return {
        type: 'Polygon',
        coordinates: [
          [
            viewport.unproject([0, 0]),
            viewport.unproject([viewport.width, 0]),
            viewport.unproject([viewport.width, viewport.height]),
            viewport.unproject([0, viewport.height]),
            viewport.unproject([0, 0]),
          ],
        ],
      };
    }

    return undefined;
  }
}
