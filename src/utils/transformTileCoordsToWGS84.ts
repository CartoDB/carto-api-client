import {lerp} from '@math.gl/core';
import {lngLatToWorld, worldToLngLat} from '@math.gl/web-mercator';
import {GeoJsonGeometryTypes, Geometry, Position} from 'geojson';
import {BBox} from '../types';

type TransformFn = (coordinates: any[], bbox: Position[]) => any[];

const TRANSFORM_FN: Record<
  Exclude<GeoJsonGeometryTypes, 'GeometryCollection'>,
  TransformFn
> = {
  Point: transformPoint,
  MultiPoint: transformMultiPoint,
  LineString: transformLineString,
  MultiLineString: transformMultiLineString,
  Polygon: transformPolygon,
  MultiPolygon: transformMultiPolygon,
};

/**
 * Transform tile coords to WGS84 coordinates.
 *
 * @param geometry - any valid geojson geometry
 * @param bbox - tile bbox as used in deck.gl
 */
export function transformTileCoordsToWGS84<T extends Geometry>(
  geometry: T,
  bbox: BBox
): T {
  const nw = lngLatToWorld([bbox.west, bbox.north]);
  const se = lngLatToWorld([bbox.east, bbox.south]);
  const projectedBbox = [nw, se];

  if (geometry.type === 'GeometryCollection') {
    throw new Error('Unsupported geometry type GeometryCollection');
  }

  const transformFn = TRANSFORM_FN[geometry.type];
  const coordinates = transformFn(geometry.coordinates, projectedBbox);
  return {...geometry, coordinates};
}

function transformPoint([pointX, pointY]: Position, [nw, se]: Position[]) {
  const x = lerp(nw[0], se[0], pointX);
  const y = lerp(nw[1], se[1], pointY);

  return worldToLngLat([x, y]);
}

function getPoints(geometry: Position[], bbox: Position[]) {
  return geometry.map((g) => transformPoint(g, bbox));
}

function transformMultiPoint(multiPoint: Position[], bbox: Position[]) {
  return getPoints(multiPoint, bbox);
}

function transformLineString(line: Position[], bbox: Position[]) {
  return getPoints(line, bbox);
}

function transformMultiLineString(
  multiLineString: Position[][],
  bbox: Position[]
) {
  return multiLineString.map((lineString) =>
    transformLineString(lineString, bbox)
  );
}

function transformPolygon(polygon: Position[][], bbox: Position[]) {
  return polygon.map((polygonRing) => getPoints(polygonRing, bbox));
}

function transformMultiPolygon(multiPolygon: Position[][][], bbox: Position[]) {
  return multiPolygon.map((polygon) => transformPolygon(polygon, bbox));
}
