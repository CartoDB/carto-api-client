import {SpatialIndex} from '../constants.js';
import {getResolution as quadbinGetResolution} from 'quadbin';
import type {SpatialFilter, SpatialIndexTile} from '../types.js';
import type {Feature} from 'geojson';
import {getResolution as h3GetResolution} from 'h3-js';
import type {FeatureData} from '../types-internal.js';
import type {SpatialDataType} from '../sources/types.js';
import {intersectTileH3, intersectTileQuadbin} from './tileIntersection.js';

export type TileFeaturesSpatialIndexOptions = {
  tiles: SpatialIndexTile[];
  spatialFilter?: SpatialFilter;
  spatialDataColumn: string;
  spatialDataType: SpatialDataType;
};

export function tileFeaturesSpatialIndex({
  tiles,
  spatialFilter,
  spatialDataColumn,
  spatialDataType,
}: TileFeaturesSpatialIndexOptions): FeatureData[] {
  const map = new Map();
  const spatialIndex = getSpatialIndex(spatialDataType);
  const cellResolution = getResolution(tiles, spatialIndex);
  const spatialIndexIDName = spatialDataColumn
    ? spatialDataColumn
    : spatialIndex;

  if (!cellResolution) {
    return [];
  }

  let intersection: undefined | boolean | Set<bigint | string>;

  // Compute H3 intersection globally, Quadbin intersection per-tile. See tileIntersection.ts.
  if (spatialIndex === SpatialIndex.H3) {
    intersection = intersectTileH3(cellResolution as number, spatialFilter);
  }

  for (const tile of tiles) {
    if (tile.isVisible === false || !tile.data) {
      continue;
    }

    if (spatialIndex === SpatialIndex.QUADBIN) {
      const parent = getTileIndex(tile, spatialIndex);
      intersection = intersectTileQuadbin(
        parent as bigint,
        cellResolution as bigint,
        spatialFilter
      );
    }

    if (!intersection) continue;

    tile.data.forEach((d: Feature) => {
      // @ts-expect-error Mixed types for cell indices.
      if (intersection === true || intersection.has(d.id as bigint | string)) {
        map.set(d.id, {...d.properties, [spatialIndexIDName]: d.id});
      }
    });
  }
  return Array.from(map.values());
}

function getTileIndex(
  tile: SpatialIndexTile,
  spatialIndex: SpatialIndex
): bigint | string {
  if (spatialIndex === SpatialIndex.QUADBIN) {
    // @ts-expect-error Missing types for quadbin tile indices.
    return tile.index.q;
  }
  return tile.id;
}

function getResolution(
  tiles: SpatialIndexTile[],
  spatialIndex: SpatialIndex
): bigint | number | undefined {
  const data = tiles.find((tile) => tile.data?.length)?.data;

  if (!data) {
    return;
  }

  if (spatialIndex === SpatialIndex.QUADBIN) {
    return Number(quadbinGetResolution(data[0].id));
  }

  if (spatialIndex === SpatialIndex.H3) {
    return h3GetResolution(data[0].id);
  }
}

function getSpatialIndex(spatialDataType: SpatialDataType): SpatialIndex {
  switch (spatialDataType) {
    case 'h3':
      return SpatialIndex.H3;
    case 'quadbin':
      return SpatialIndex.QUADBIN;
    default:
      throw new Error('Unexpected spatial data type');
  }
}
