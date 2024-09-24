import {SpatialFilter} from './types';

/**
 * Given viewport bounds ([minX, minY, maxX, maxY]) in mercator-projected
 * space, as provided by deck.gl's viewport.getBounds(), returns a GeoJSON
 * Polygon representing the viewport. Intended for use as a {@link SpatialFilter}
 * in widget APIs.
 */
export function createViewportSpatialFilter(
  viewport: [number, number, number, number]
): SpatialFilter | undefined {
  // If viewport is large enough to represent global coverage, skip the filter.
  const [minx, miny, maxx, maxy] = viewport;
  if (maxx - minx > 179.5 * 2) {
    return;
  }

  return {
    type: 'Polygon',
    coordinates: [
      [
        [minx, miny],
        [maxx, miny],
        [maxx, maxy],
        [minx, maxy],
        [minx, miny],
      ],
    ],
  };
}
