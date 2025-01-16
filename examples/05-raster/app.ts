import maplibregl from 'maplibre-gl';
import {Color, Deck, WebMercatorViewport} from '@deck.gl/core';
import {colorBins, RasterTileLayer} from '@deck.gl/carto';
import {
  Filter,
  TilejsonResult,
  WidgetRasterSource,
  rasterSource,
  createViewportSpatialFilter,
} from '@carto/api-client';
import '../components/index.js';
import type {Widget, FilterEvent} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: TilejsonResult & {widgetSource: WidgetRasterSource};
let viewState = {longitude: -95, latitude: 38.8, zoom: 8};
// let viewState = {latitude: 40.7128, longitude: -74.006, zoom: 12};
let filters: Record<string, Filter> = {};
let getFillColor: any = [255, 0, 0, 255];

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
  // bindWidget('#category'),
  bindWidget('#formula'),
  // bindWidget('#histogram'),
  // bindWidget('#pie'),
  // bindWidget('#scatter'),
  // bindWidget('#table'),
];

updateSources();

/**************************************************************************
 * UPDATES
 */

async function updateSources() {
  data = await rasterSource({
    connectionName: 'amanzanares-bq',
    tableName: 'cartodb-on-gcp-pm-team.amanzanares_raster.classification_us',
    accessToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfNDd1dW5tZWciLCJqdGkiOiI1Njc2MDQ0NCJ9.p2_1ts1plciXMI3Pk0GJaHjhdZUd0lKITgdO9BaX2ho',
  });

  document.querySelector('#footer')!.innerHTML = data.attribution;

  updateFillColor(data);
  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new RasterTileLayer({
    id: 'raster',
    data: data,
    tileSize: 512,
    getFillColor,
    onViewportLoad: (tiles) => {
      console.log({tiles});
      const viewport = new WebMercatorViewport(viewState);
      const spatialFilter = createViewportSpatialFilter(viewport.getBounds())!;
      data.widgetSource.loadTiles(tiles);
      data.widgetSource.extractTileFeatures({spatialFilter});
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

function updateFillColor(tilejson: TilejsonResult) {
  const bandMetadata = tilejson.raster_metadata?.bands[0]!;

  if (bandMetadata.colorinterp === 'palette') {
    getFillColor = (d: any): Color => {
      const value = d.properties.band_1;
      return bandMetadata.colortable![value] ?? [0, 0, 0, 0];
    };
  } else {
    getFillColor = [255, 0, 0, 255];
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
