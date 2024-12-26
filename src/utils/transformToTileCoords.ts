import {lngLatToWorld} from '@math.gl/web-mercator';
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
 * Transform WGS84 coordinates to tile coords.
 * It's the inverse of deck.gl coordinate-transform (https://github.com/visgl/deck.gl/blob/master/modules/geo-layers/src/mvt-layer/coordinate-transform.js)
 *
 * @param {object} geometry - any valid geojson geometry
 * @param {{ west: number, east: number, north: number, south: number }} bbox - tile bbox as used in deck.gl
 * @returns {GeoJSON}
 */
export function transformToTileCoords<T extends Geometry>(
  geometry: T,
  bbox: BBox
) {
  const nw = projectFlat([bbox.west, bbox.north]);
  const se = projectFlat([bbox.east, bbox.south]);
  const projectedBbox = [nw, se];

  if (geometry.type === 'GeometryCollection') {
    throw new Error('Unsupported geometry type GeometryCollection');
  }

  const transformFn = TRANSFORM_FN[geometry.type];
  const coordinates = transformFn(geometry.coordinates, projectedBbox);
  return {...geometry, coordinates};
}

function transformPoint([pointX, pointY]: Position, [nw, se]: Position[]) {
  const x = inverseLerp(nw[0], se[0], pointX);
  const y = inverseLerp(nw[1], se[1], pointY);

  return [x, y];
}

function getPoints(geometry: Position[], bbox: Position[]) {
  return geometry.map((g) => transformPoint(projectFlat(g), bbox));
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

function projectFlat(xyz: Position): Position {
  return lngLatToWorld(xyz);
}

function inverseLerp(a: number, b: number, x: number): number {
  return (x - a) / (b - a);
}
