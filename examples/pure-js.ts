import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';
import {
  AggregationTypes,
  FormulaWidget,
  CategoryWidget,
  FilterEvent,
  Filter,
  PieWidget,
  vectorTableSource,
  VectorTableSourceResponse,
} from '../';

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

const widgets = [
  bindWidget('formula', {
    source: {
      data: 'carto-demo-data.demo_tables.retail_stores', // REDUNDANT
      type: 'table', // REDUNDANT
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom',
      provider: 'bigquery',
      filters: filters, // REDUNDANT
    },
    operation: AggregationTypes.COUNT,
    column: '',
    global: false,
  }),
  bindWidget('category', {
    source: {
      data: 'carto-demo-data.demo_tables.retail_stores', // REDUNDANT
      type: 'table', // REDUNDANT
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom', // REDUNDANT
      provider: 'bigquery',
      filters: filters, // REDUNDANT
    },
    operation: AggregationTypes.COUNT,
    column: 'storetype',
    global: false,
  }),
  bindWidget('pie', {
    source: {
      data: 'carto-demo-data.demo_tables.retail_stores',
      type: 'table',
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom', // REDUNDANT
      provider: 'bigquery',
      filters: filters, // REDUNDANT
    },
    operation: AggregationTypes.COUNT,
    column: 'storetype',
    global: false,
  }),
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

// TODO: Improve type definitions.
function bindWidget(id: string, config: unknown): CategoryWidget | PieWidget | FormulaWidget {
  const widget = document.querySelector(`#${id}`) as any;
  widget.config = config;

  widget.addEventListener('filter', (event: FilterEvent) => {
    filters = event.detail.filters;
    updateSources();
  });

  return widget;
}
