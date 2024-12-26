import maplibregl from 'maplibre-gl';
import {Deck, WebMercatorViewport} from '@deck.gl/core';
import {colorBins, VectorTileLayer} from '@deck.gl/carto';
import {
  Filter,
  TilejsonResult,
  WidgetTilesetSource,
  vectorTilesetSource,
  createViewportSpatialFilter,
} from '@carto/api-client';
import '../components/index.js';
import type {Widget, FilterEvent} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: TilejsonResult & {widgetSource: WidgetTilesetSource};
let viewState = {latitude: 40.7128, longitude: -74.006, zoom: 5};
let filters: Record<string, Filter> = {};

/**************************************************************************
 * DECK.GL
 */

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: viewState,
  controller: true,
  layers: [],
});

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  interactive: false,
});

deck.setProps({
  onViewStateChange: (params) => {
    viewState = params.viewState;
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
    updateWidgets();
  },
});

const widgets: Widget[] = [bindWidget('#formula')];

updateSources();

/**************************************************************************
 * UPDATES
 */

async function updateSources() {
  data = await vectorTilesetSource({
    tableName: 'carto-demo-data.demo_tilesets.sociodemographics_usa_blockgroup',
    accessToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfNDd1dW5tZWciLCJqdGkiOiI1Njc2MDQ0NCJ9.p2_1ts1plciXMI3Pk0GJaHjhdZUd0lKITgdO9BaX2ho',
    connectionName: 'carto_dw',
  });

  document.querySelector('#footer')!.innerHTML = data.attribution;

  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new VectorTileLayer({
    id: 'temperature',
    data,
    getFillColor: colorBins({
      attr: 'band_1',
      domain: [15, 18, 22, 25, 28, 30, 35],
      colors: 'Temps',
    }),
    onViewportLoad: (tiles) => {
      const viewport = new WebMercatorViewport(viewState);
      const spatialFilter = createViewportSpatialFilter(viewport.getBounds())!;
      data.widgetSource.loadTiles({tiles, spatialFilter});
      updateWidgets(); // TODO: OK?

      // TODO: Force widget refresh, somehow... need a new WidgetTilesetSource instance?

      // TODO: Or can we wait for tiles to load, awaiting in getFormula until then?
      // ...does viewstate change imply that an onViewportLoad event is coming?

      // TODO: Maybe this is an argument for re-creating the class, or similar, rather
      // than tying its lifecycle to the source/tilejson?
    },
  });

  deck.setProps({layers: [layer]});
}

function updateWidgets() {
  for (const widget of widgets) {
    widget.data = Promise.resolve(data); // TODO: Awkward to resolve, may force re-fetch.
    widget.viewState = viewState;
  }
}

/**************************************************************************
 * INITIALIZATION
 */

function bindWidget(selector: string): Widget {
  const widget = document.querySelector<Widget>(selector)!;

  widget.addEventListener('filter', (event) => {
    filters = (event as FilterEvent).detail.filters;
    updateSources();
  });

  return widget;
}
