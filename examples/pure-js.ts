import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {VectorTileLayer, vectorTableSource} from '@deck.gl/carto';
import {
  TableDataView,
  AggregationTypes,
  FormulaWidget,
  CategoryWidget,
} from '../';

/**************************************************************************
 * LAYERS
 */

const cartoData = vectorTableSource({
  accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
  connectionName: 'carto_dw',
  tableName: 'carto-demo-data.demo_tables.retail_stores',
});

const layer = new VectorTileLayer({
  id: 'retail_stores',
  data: cartoData,
  pointRadiusMinPixels: 4,
  getFillColor: [200, 0, 80],
});

/**************************************************************************
 * DECK.GL
 */

let viewState = {latitude: 40.7128, longitude: -74.0060, zoom: 12};

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: viewState,
  controller: true,
  layers: [layer],
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

/**************************************************************************
 * WIDGETS
 */

const railEl = document.querySelector('#rail')!;
const formulaWidget = railEl.querySelector('#formula') as FormulaWidget;
const categoryWidget = railEl.querySelector('#category') as CategoryWidget;

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
      id: '0717773c-f5d9-444c-a47d-0a4689667850',
      data: 'carto-demo-data.demo_tables.retail_stores',
      type: 'table',
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom',
      provider: 'bigquery',
      filters: {},
    },
    operation: AggregationTypes.COUNT,
    column: '',
    global: false,
  };

  categoryWidget.dataView = dataView;
  categoryWidget.config = {
    // TODO(cleanup)
    source: {
      id: '0717773c-f5d9-444c-a47d-0a4689667850',
      data: 'carto-demo-data.demo_tables.retail_stores',
      type: 'table',
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom',
      provider: 'bigquery',
      filters: {},
    },
    operation: AggregationTypes.COUNT,
    column: 'storetype',
    global: false,
  };
}

/**************************************************************************
 * ATTRIBUTION
 */

const footerEl = document.querySelector('#footer')!;
cartoData.then(({attribution}) => {
  footerEl.innerHTML = attribution;
});
