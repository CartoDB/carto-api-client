import {
  DEFAULT_AGGREGATION_RES_LEVEL_H3,
  DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN,
} from './constants-internal';
import type {ModelSource} from './models/model';
import type {AggregationOptions} from './sources/types';
import {assert} from './utils';
import type {ViewState} from './widget-sources';

const DEFAULT_TILE_SIZE = 512;
const QUADBIN_ZOOM_MAX_OFFSET = 4;

export function getSpatialFiltersResolution(
  source: Partial<ModelSource & AggregationOptions>,
  viewState: ViewState
): number | undefined {
  const dataResolution = source.dataResolution ?? Number.MAX_VALUE;

  const aggregationResLevel =
    source.aggregationResLevel ??
    (source.spatialDataType === 'h3'
      ? DEFAULT_AGGREGATION_RES_LEVEL_H3
      : DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN);

  const aggregationResLevelOffset = Math.max(
    0,
    Math.floor(aggregationResLevel)
  );

  const currentZoomInt = Math.ceil(viewState.zoom);
  if (source.spatialDataType === 'h3') {
    const tileSize = DEFAULT_TILE_SIZE;
    const maxResolutionForZoom =
      maxH3SpatialFiltersResolutions.find(
        ([zoom]) => zoom === currentZoomInt
      )?.[1] ?? Math.max(0, currentZoomInt - 3);

    const maxSpatialFiltersResolution = maxResolutionForZoom
      ? Math.min(dataResolution, maxResolutionForZoom)
      : dataResolution;

    const hexagonResolution =
      getHexagonResolution(viewState, tileSize) + aggregationResLevelOffset;

    return Math.min(hexagonResolution, maxSpatialFiltersResolution);
  }

  if (source.spatialDataType === 'quadbin') {
    const maxResolutionForZoom = currentZoomInt + QUADBIN_ZOOM_MAX_OFFSET;
    const maxSpatialFiltersResolution = Math.min(
      dataResolution,
      maxResolutionForZoom
    );

    const quadsResolution =
      Math.floor(viewState.zoom) + aggregationResLevelOffset;
    return Math.min(quadsResolution, maxSpatialFiltersResolution);
  }

  return undefined;
}

const maxH3SpatialFiltersResolutions = [
  [20, 14],
  [19, 13],
  [18, 12],
  [17, 11],
  [16, 10],
  [15, 9],
  [14, 8],
  [13, 7],
  [12, 7],
  [11, 7],
  [10, 6],
  [9, 6],
  [8, 5],
  [7, 4],
  [6, 4],
  [5, 3],
  [4, 2],
  [3, 1],
  [2, 1],
  [1, 0],
];

// stolen from https://github.com/visgl/deck.gl/blob/master/modules/carto/src/layers/h3-tileset-2d.ts

// Relative scale factor (0 = no biasing, 2 = a few hexagons cover view)
const BIAS = 2;

// Resolution conversion function. Takes a WebMercatorViewport and returns
// a H3 resolution such that the screen space size of the hexagons is
// similar
export function getHexagonResolution(
  viewport: {zoom: number; latitude: number},
  tileSize: number
): number {
  // Difference in given tile size compared to deck's internal 512px tile size,
  // expressed as an offset to the viewport zoom.
  const zoomOffset = Math.log2(tileSize / DEFAULT_TILE_SIZE);
  const hexagonScaleFactor = (2 / 3) * (viewport.zoom - zoomOffset);
  const latitudeScaleFactor = Math.log(
    1 / Math.cos((Math.PI * viewport.latitude) / 180)
  );

  // Clip and bias
  return Math.max(
    0,
    Math.floor(hexagonScaleFactor + latitudeScaleFactor - BIAS)
  );
}
