import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';
import {
  Filter,
  vectorTableSource,
  VectorTableSourceResponse,
} from '@carto/api-client';
import '../components/index.js';
import type {Widget, FilterEvent} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: Promise<VectorTableSourceResponse>;
let viewState = {latitude: 40.7128, longitude: -74.006, zoom: 12};
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

const widgets: Widget[] = [
  bindWidget('#category'),
  bindWidget('#formula'),
  bindWidget('#histogram'),
  bindWidget('#pie'),
  bindWidget('#scatter'),
  bindWidget('#table'),
];

updateSources();

/**************************************************************************
 * UPDATES
 */

function updateSources() {
  data = vectorTableSource({
    accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName: 'carto-demo-data.demo_tables.retail_stores',
    filters,
  });

  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new VectorTileLayer({
    id: 'retail_stores',
    data,
    pointRadiusMinPixels: 4,
    getFillColor: [200, 0, 80],
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
