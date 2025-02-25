import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {H3TileLayer} from '@deck.gl/carto';
import {
  TilejsonResult,
  WidgetTilesetSource,
  h3TilesetSource,
} from '@carto/api-client';
import '../components/index.js';
import type {Widget} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: TilejsonResult & {widgetSource: WidgetTilesetSource};
let viewState = {latitude: 40.7128, longitude: -74.006, zoom: 12};

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
  bindWidget('#histogram'),
  bindWidget('#scatter'),
  bindWidget('#table'),
];

await updateSources();

/**************************************************************************
 * UPDATES
 */

async function updateSources() {
  if (data?.widgetSource) {
    await data.widgetSource.destroy();
  }

  data = await h3TilesetSource({
    tableName:
      'cartodb-on-gcp-frontend-team.donmccurdy.retail_stores_tileset_h3',
    accessToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfNDd1dW5tZWciLCJqdGkiOiI1Njc2MDQ0NCJ9.p2_1ts1plciXMI3Pk0GJaHjhdZUd0lKITgdO9BaX2ho',
    connectionName: 'bqconn-front',
  });

  document.querySelector('#footer')!.innerHTML = data.attribution;

  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new H3TileLayer({
    id: 'retail_stores',
    data,
    pointRadiusMinPixels: 4,
    getFillColor: [200, 0, 80],
    extruded: false,
    onViewportLoad: (tiles) => {
      data.widgetSource.loadTiles(tiles);
      updateWidgets();
    },
  });

  deck.setProps({layers: [layer]});
}

function updateWidgets() {
  for (const widget of widgets) {
    widget.data = Promise.resolve(data);
    widget.viewState = viewState;
  }
}

/**************************************************************************
 * INITIALIZATION
 */

function bindWidget(selector: string): Widget {
  return document.querySelector<Widget>(selector)!;
}
