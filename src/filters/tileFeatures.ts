import {MultiPolygon, Polygon} from 'geojson';
import {Tile} from '../types';
import tileFeaturesGeometries from './tileFeaturesGeometries';
import tileFeaturesSpatialIndex from './tileFeaturesSpatialIndex';
import {SpatialIndex, TileFormat} from '../constants';

export function tileFeatures({
  tiles,
  geometryToIntersect,
  uniqueIdProperty,
  tileFormat,
  geoColumName,
  spatialIndex,
  options,
}: {
  tiles?: Tile; // TODO: add proper deck.gl type
  geometryToIntersect?: Polygon | MultiPolygon;
  // TODO(design)
  // viewport?: Viewport;
  // geometry?: Polygon | MultiPolygon;
  uniqueIdProperty?: string;
  tileFormat: TileFormat;
  geoColumName?: string;
  spatialIndex?: SpatialIndex;
  options?: {storeGeometry: boolean};
}): unknown[] {
  // TODO(design)
  // const geometryToIntersect = getGeometryToIntersect(viewport, geometry);

  // if (!geometryToIntersect) {
  //   return [];
  // }

  if (spatialIndex) {
    return tileFeaturesSpatialIndex({
      tiles,
      geometryToIntersect,
      geoColumName, // TODO(cleanup): Spelling.
      spatialIndex,
    });
  }
  return tileFeaturesGeometries({
    tiles,
    tileFormat,
    geometryToIntersect,
    uniqueIdProperty,
    options,
  });
}
