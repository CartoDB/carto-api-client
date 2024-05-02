import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {VectorTileLayer, vectorTableSource} from '@deck.gl/carto';
import {TableDataView, AggregationTypes, DataFormula} from '../';

/**************************************************************************
 * DATA SOURCE
 */

const cartoData = vectorTableSource({
  accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
  connectionName: 'carto_dw',
  tableName: 'carto-demo-data.demo_tables.world_airports',
});

/**************************************************************************
 * DECK.GL
 */

const layer = new VectorTileLayer({
  id: 'world_airports',
  data: cartoData,
  pointRadiusMinPixels: 4,
  getFillColor: [200, 0, 80],
});

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: {latitude: 0, longitude: 0, zoom: 0},
  onViewStateChange: ({viewState}) => {
    // TODO: set widget viewstate
    return viewState;
  },
  controller: true,
  layers: [layer],
});

const style =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const map = new maplibregl.Map({container: 'map', style, interactive: false});

deck.setProps({
  onViewStateChange: ({viewState}) => {
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
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
 * RAIL
 */

const railEl = document.querySelector('#rail')!;

const dataView = new TableDataView({
  accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
  connectionName: 'carto_dw',
  tableName: 'carto-demo-data.demo_tables.world_airports',
});

const widgetEl = document.createElement('data-formula') as DataFormula;
widgetEl.header = 'Count'
widgetEl.caption = 'Formula widget';
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
  global: false,
  spatialFilter: {
    type: 'Polygon',
    coordinates: [
      [
        [-101.63558009143567, 25.84464755627611],
        [-85.32461515892574, 25.84464755627611],
        [-85.32461515892574, 42.75212142332033],
        [-101.63558009143567, 42.75212142332033],
        [-101.63558009143567, 25.84464755627611],
      ],
    ],
  },
};
railEl.appendChild(widgetEl);
