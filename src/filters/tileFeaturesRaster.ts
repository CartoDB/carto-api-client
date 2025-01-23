import {bigIntToHex, cellToChildren, getResolution} from 'quadbin';
import {RasterTile, SpatialFilter, SpatialIndexTile, Tile} from '../types';
import {Feature} from 'geojson';
import {tileFeaturesSpatialIndex} from './tileFeaturesSpatialIndex';
import {FeatureData} from '../types-internal';
import {SpatialDataType} from '../sources/types';

export type TileFeaturesRasterOptions = {
  tiles: RasterTile[];
  spatialFilter: SpatialFilter;
  spatialDataColumn: string;
  spatialDataType: SpatialDataType;
};

export function tileFeaturesRaster({
  tiles,
  ...options
}: TileFeaturesRasterOptions): FeatureData[] {
  const quadbinTiles: SpatialIndexTile[] = [];

  for (const tile of tiles) {
    const parent = tile.index.q as bigint;
    const blockSize = tile.data!.blockSize as number;

    // Raster tiles, and all pixels, are quadbin cells. Resolution of a pixel is
    // the resolution of the tile, plus the number of subdivisions. Block size
    // must be square, N x N, where N is a power of two.
    const resolution = getResolution(parent) + BigInt(Math.log2(blockSize));
    const children = cellToChildren(parent, resolution);

    const cells: {id: bigint; properties: Feature['properties']}[] = [];

    // Order is row-major, starting from NW and ending at SE.
    for (let i = 0; i < children.length; i++) {
      const id = children[i];
      // TODO(DO NOT SUBMIT): Do we expose per-pixel cell IDs for widget
      // operations? Under what name?
      const properties: Record<string, unknown> = {id: bigIntToHex(id)};
      for (const prop in tile.data!.cells.numericProps) {
        properties[prop] = tile.data!.cells.numericProps[prop].value[i];
      }
      cells.push({id, properties});
    }

    // @ts-expect-error TODO(DO NOT SUBMIT): Handle this better.
    quadbinTiles.push({...tile, data: cells});
  }

  // TODO: With viewport covered by Lake Michigan, we still see a lot
  // of variation in band_1 according to widgets, is something wrong?
  return tileFeaturesSpatialIndex({tiles: quadbinTiles, ...options});
}

export function isRasterTile(tile: Tile): tile is RasterTile {
  return tile.data ? tile.data.hasOwnProperty('cells') : false;
}
