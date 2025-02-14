import {css, CSSResultGroup, LitElement} from 'lit';
import {
  createViewportSpatialFilter,
  SpatialFilter,
  WidgetSource,
} from '@carto/api-client';
import {MapViewState, WebMercatorViewport} from '@deck.gl/core';

export abstract class BaseWidget extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      --padding: 16px;

      position: relative;
      display: block;
      border: solid 1px gray;
      padding: var(--padding);
      max-width: 800px;
    }
    h3,
    p,
    figure {
      margin: 0;
      padding: 0;
    }
    figcaption {
      font-size: 0.8em;
      opacity: 0.8;
    }
    .chart {
      width: 100%;
      height: 200px;
    }
    .clear-btn {
      position: absolute;
      top: var(--padding);
      right: var(--padding);
    }
  `;

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
  declare spatialFilter: SpatialFilter | null;

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
      return createViewportSpatialFilter(viewport.getBounds());
    }

    return undefined;
  }

  protected _onError(error: unknown) {
    console.error(error);
  }
}
