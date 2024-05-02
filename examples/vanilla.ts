import maplibregl from 'maplibre-gl';
import {Deck, WebMercatorViewport} from '@deck.gl/core';
import {VectorTileLayer, vectorTableSource} from '@deck.gl/carto';
import {TableDataView, AggregationTypes, DataFormula} from '../';

/**************************************************************************
 * LAYERS
 */

const cartoData = vectorTableSource({
  accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
  connectionName: 'carto_dw',
  tableName: 'carto-demo-data.demo_tables.world_airports',
});

const layer = new VectorTileLayer({
  id: 'world_airports',
  data: cartoData,
  pointRadiusMinPixels: 4,
  getFillColor: [200, 0, 80],
});

/**************************************************************************
 * DECK.GL
 */

let viewState = {latitude: 0, longitude: 0, zoom: 0};

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: viewState,
  controller: true,
  layers: [layer],
});

const style =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const map = new maplibregl.Map({container: 'map', style, interactive: false});

deck.setProps({
  onViewStateChange: (params) => {
    const {longitude, latitude, ...rest} = params.viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
    viewState = params.viewState;
    updateWidgets();
  },
});

/**************************************************************************
 * FOOTER
 */

cartoData.then(({attribution}) => {
  const footerEl = document.querySelector('#footer')!;
  footerEl.innerHTML = attribution;
});

/**************************************************************************
 * WIDGETS
 */

const railEl = document.querySelector('#rail')!;
const widgetEl = document.createElement('data-formula') as DataFormula;
widgetEl.header = 'Count'
widgetEl.caption = 'Formula widget';
railEl.appendChild(widgetEl);

function updateWidgets() {
  const dataView = new TableDataView({
    accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName: 'carto-demo-data.demo_tables.world_airports',
    viewState,
  });

  widgetEl.dataView = dataView;
  widgetEl.config = {
    // TODO(cleanup)
    source: {
      id: '85f6ea18-f3f3-4392-b52a-ca3c13c1a4f5',
      data: 'carto-demo-data.demo_tables.world_airports',
      type: 'table',
      filtersLogicalOperator: 'and',
      queryParameters: [],
      geoColumn: 'geom',
      provider: 'bigquery',
      filters: {},
    },
    operation: AggregationTypes.COUNT,
    column: '',
    global: false
  };
}
