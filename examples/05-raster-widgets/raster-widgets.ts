import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {colorBins, RasterTileLayer} from '@deck.gl/carto';
import {rasterSource, Filter, TilejsonResult} from '@carto/api-client';
import '../components/index.js';
import type {Widget, FilterEvent} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: Promise<TilejsonResult>;
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
  data = await rasterSource({
    tableName: 'cartodb-on-gcp-frontend-team.zbyszek.cog_float64_66kb-v2',
    accessToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfNDd1dW5tZWciLCJqdGkiOiI1Njc2MDQ0NCJ9.p2_1ts1plciXMI3Pk0GJaHjhdZUd0lKITgdO9BaX2ho',
    connectionName: 'bqconn-front',
    filters,
  });

  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new RasterTileLayer({
    id: 'temperature',
    data,
    getFillColor: colorBins({
      attr: 'band_1',
      domain: [15, 18, 22, 25, 28, 30, 35],
      colors: 'Temps',
    }),
    onTileLoad: data.widgetSource.onTileLoad,
    onTileUnload: data.widgetSource.onTileUnload,
  });

  deck.setProps({layers: [layer]});
  data.then(({attribution}) => {
    document.querySelector('#footer')!.innerHTML = attribution;
  });
}

function updateWidgets() {
  for (const widget of widgets) {
    widget.data = data;
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
