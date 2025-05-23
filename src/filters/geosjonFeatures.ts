import intersects from '@turf/boolean-intersects';
import type {FeatureCollection} from 'geojson';
import type {FeatureData} from '../types-internal.js';
import type {SpatialFilter} from '../types.js';

export function geojsonFeatures({
  geojson,
  spatialFilter,
  uniqueIdProperty,
}: {
  geojson: FeatureCollection;
  spatialFilter: SpatialFilter;
  uniqueIdProperty?: string;
}): FeatureData[] {
  let uniqueIdx = 0;
  const map = new Map();

  if (!spatialFilter) {
    return [];
  }

  for (const feature of geojson.features) {
    const uniqueId = uniqueIdProperty
      ? feature.properties![uniqueIdProperty]
      : ++uniqueIdx;
    if (!map.has(uniqueId) && intersects(spatialFilter, feature)) {
      map.set(uniqueId, feature.properties);
    }
  }

  return Array.from(map.values());
}
