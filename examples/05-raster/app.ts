import maplibregl from 'maplibre-gl';
import {Color, Deck} from '@deck.gl/core';
import {RasterTileLayer} from '@deck.gl/carto';
import {
  rasterSource,
  TilejsonResult,
  WidgetRasterSource,
} from '@carto/api-client';
import '../components/index.js';
import type {
  Widget,
  CategoryWidget,
  HistogramWidget,
} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: TilejsonResult & {widgetSource: WidgetRasterSource};
let viewState = {latitude: 42.728, longitude: -87.731, zoom: 8.75};

const _getFillColor = (value: number): Color => {
  if (value === 0) {
    return [0, 0, 0, 0];
  } else if (value < 64) {
    return [255, 0, 0, 255];
  } else if (value < 128) {
    return [0, 255, 0, 255];
  } else if (value < 192) {
    return [0, 0, 255, 255];
  } else {
    return [0, 255, 255, 255];
  }
};
const getFillColorLayer = (d: any): Color => _getFillColor(d.properties.band_1);
const getFillColorCSS = (item: string | number): string =>
  `rgba(${_getFillColor(Number(item)).join()})`;

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

const formulaWidget = bindWidget('#formula');
const categoryWidget = bindWidget('#category') as CategoryWidget;
const histogramWidget = bindWidget('#histogram') as HistogramWidget;
const widgets: Widget[] = [formulaWidget, categoryWidget, histogramWidget];

await updateSources();

/**************************************************************************
 * UPDATES
 */

async function updateSources() {
  if (data?.widgetSource) {
    data.widgetSource.destroy();
  }

  data = await rasterSource({
    connectionName: 'amanzanares-bq',
    tableName: 'cartodb-on-gcp-pm-team.amanzanares_raster.classification_us',
    accessToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfNDd1dW5tZWciLCJqdGkiOiI1Njc2MDQ0NCJ9.p2_1ts1plciXMI3Pk0GJaHjhdZUd0lKITgdO9BaX2ho',
  });

  document.querySelector('#footer')!.innerHTML = data.attribution;

  updateLayers();
}

function updateLayers() {
  const layer = new RasterTileLayer({
    id: 'raster',
    data: data,
    tileSize: 1024,
    getFillColor: getFillColorLayer,
    onViewportLoad: updateTiles,
  });

  deck.setProps({layers: [layer]});
}

function updateTiles(tiles: unknown[]) {
  data.widgetSource.loadTiles(tiles);
  updateWidgetsDebounced();
}

function updateWidgets() {
  for (const widget of widgets) {
    widget.data = Promise.resolve(data);
    widget.viewState = viewState;
  }
  categoryWidget.getItemColor = getFillColorCSS;
  histogramWidget.getItemColor = getFillColorCSS;
}

const updateWidgetsDebounced = debounce(updateWidgets, 200);

/**************************************************************************
 * INITIALIZATION
 */

deck.setProps({
  onViewStateChange: (params) => {
    viewState = params.viewState;
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
    updateWidgetsDebounced();
  },
});

function bindWidget(selector: string): Widget {
  return document.querySelector<Widget>(selector)!;
}

/**************************************************************************
 * UTILS
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function debounce<T extends Function>(callback: T, ms: number): T {
  let timeoutID: number = -1;
  return ((...args: unknown[]) => {
    window.clearTimeout(timeoutID);
    timeoutID = window.setTimeout(() => {
      callback(...args);
    }, ms);
  }) as unknown as T;
}
