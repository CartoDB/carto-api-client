import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {H3TileLayer} from '@deck.gl/carto';
import {Filter, h3TableSource, H3TableSourceResponse} from '@carto/api-client';
import '../components/index.js';
import type {Widget, FilterEvent} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: Promise<H3TableSourceResponse>;
let viewState = {latitude: 37.375, longitude: -5.996, zoom: 6};
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
  bindWidget('#formula'),
  bindWidget('#category'),
  bindWidget('#pie'),
  bindWidget('#table'),
  bindWidget('#scatter'),
  bindWidget('#histogram'),
];

updateSources();

/**************************************************************************
 * UPDATES
 */

function updateSources() {
  data = h3TableSource({
    accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName:
      'carto-demo-data.demo_tables.derived_spatialfeatures_esp_h3res8_v1_yearly_v2',
    filters,
    aggregationExp: 'sum(population) as population',
  });

  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new H3TileLayer({
    id: 'retail_stores',
    data,
    pointRadiusMinPixels: 4,
    getFillColor: [200, 0, 80],
  });

  deck.setProps({layers: [layer]});
  data
    .then(({attribution}) => {
      document.querySelector('#footer')!.innerHTML = attribution;
    })
    .catch((error) => {
      console.error(error);
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
