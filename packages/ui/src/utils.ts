import {MapViewState, WebMercatorViewport} from '@deck.gl/core';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getSpatialFilter(viewState: MapViewState): any {
  const viewport = new WebMercatorViewport(viewState);
  return {
    type: 'Polygon',
    coordinates: [
      [
        viewport.unproject([0, 0]),
        viewport.unproject([viewport.width, 0]),
        viewport.unproject([viewport.width, viewport.height]),
        viewport.unproject([0, viewport.height]),
        viewport.unproject([0, 0]),
      ],
    ],
  };
}
