import maplibregl from 'maplibre-gl';
import {Deck, Layer} from '@deck.gl/core';
import {VectorTileLayer, vectorTableSource} from '@deck.gl/carto';
import {
  TableDataView,
  AggregationTypes,
  FormulaWidget,
  CategoryWidget,
  FilterEvent,
  Filter,
} from '../';

/**************************************************************************
 * REACTIVE STATE
 */

const railEl = document.querySelector('#rail')!;
const formulaWidget = railEl.querySelector('#formula') as FormulaWidget;
const categoryWidget = railEl.querySelector('#category') as CategoryWidget;
const footerEl = document.querySelector('#footer')!;

let viewState = {latitude: 40.7128, longitude: -74.0060, zoom: 12};
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

updateLayers();
updateWidgets();

/**************************************************************************
 * LAYERS
 */

function updateLayers() {
  const cartoData = vectorTableSource({
    accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName: 'carto-demo-data.demo_tables.retail_stores',
    filters,
  });

  const layer = new VectorTileLayer({
    id: 'retail_stores',
    data: cartoData,
    pointRadiusMinPixels: 4,
    getFillColor: [200, 0, 80],
  });

  deck.setProps({layers: [layer]});
  cartoData.then(({attribution}) => (footerEl.innerHTML = attribution));
}

/**************************************************************************
 * WIDGETS
 */

function updateWidgets() {
  const dataView = new TableDataView({
    accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName: 'carto-demo-data.demo_tables.retail_stores',
    viewState,
  });

  formulaWidget.dataView = dataView;
  formulaWidget.config = {
    // TODO(cleanup)
    source: {
      data: 'carto-demo-data.demo_tables.retail_stores',
      type: 'table',
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom',
      provider: 'bigquery',
      filters: filters,
    },
    operation: AggregationTypes.COUNT,
    column: '',
    global: false,
  };

  categoryWidget.dataView = dataView;
  categoryWidget.config = {
    // TODO(cleanup)
    source: {
      data: 'carto-demo-data.demo_tables.retail_stores',
      type: 'table',
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom',
      provider: 'bigquery',
      filters: filters,
    },
    operation: AggregationTypes.COUNT,
    column: 'storetype',
    global: false,
  };
  // TODO: Type definitions for events.
  (categoryWidget as any).addEventListener('filter', onFilterChange);
}

/**************************************************************************
 * EVENT LISTENERS
 */

function onFilterChange(event: FilterEvent) {
  filters = event.detail.filters;
  updateLayers();
  updateWidgets();
}
