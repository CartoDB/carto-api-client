import {cellToTile, getResolution, tileToCell} from 'quadbin';
import type {RasterTile, SpatialFilter, Tile} from '../types.js';
import type {FeatureData} from '../types-internal.js';
import type {
  RasterMetadata,
  RasterMetadataBand,
  SpatialDataType,
} from '../sources/types.js';
import {intersectTileRaster} from './tileIntersection.js';

export type TileFeaturesRasterOptions = {
  tiles: RasterTile[];
  spatialFilter?: SpatialFilter;
  spatialDataColumn: string;
  spatialDataType: SpatialDataType;
  rasterMetadata: RasterMetadata;
};

export function tileFeaturesRaster({
  tiles,
  ...options
}: TileFeaturesRasterOptions): FeatureData[] {
  // Cache band metadata for faster lookup while iterating over pixels.
  const metadataByBand: Record<string, RasterMetadataBand & {nodata: number}> =
    {};
  for (const band of options.rasterMetadata.bands) {
    // TODO(cleanup): Remove copy and cast after API is updated to return 'nodata' as a number.
    metadataByBand[band.name] = {...band, nodata: Number(band.nodata)};
  }

  // Omit empty and invisible tiles for simpler processing and types.
  tiles = tiles.filter(isRasterTileVisible);
  if (tiles.length === 0) return [];

  // Raster tiles, and all pixels, are quadbin cells. Resolution of a pixel is
  // the resolution of the tile, plus the number of subdivisions. Block size
  // must be square, N x N, where N is a power of two.
  const tileResolution = getResolution(tiles[0].index.q);
  const tileBlockSize = tiles[0].data!.blockSize;
  const cellResolution = tileResolution + BigInt(Math.log2(tileBlockSize));

  const data = new Map<bigint, FeatureData>();

  for (const tile of tiles as Required<RasterTile>[]) {
    const parent = tile.index.q;

    const intersection = intersectTileRaster(
      parent,
      cellResolution,
      options.spatialFilter
    );

    if (intersection === false) continue;

    const tileSortedCells = cellToChildrenRaster(parent, cellResolution);

    // For each pixel/cell within the spatial filter, create a FeatureData.
    // Order is row-major, starting from NW and ending at SE.
    for (let i = 0; i < tileSortedCells.length; i++) {
      if (intersection !== true && !intersection.has(tileSortedCells[i])) {
        continue;
      }

      const cellData: FeatureData = {};
      let cellDataExists = false;

      for (const band in tile.data.cells.numericProps) {
        const value = tile.data.cells.numericProps[band].value[i];
        const bandMetadata = metadataByBand[band];

        if (isValidBandValue(value, bandMetadata.nodata)) {
          cellData[band] = tile.data.cells.numericProps[band].value[i];
          cellDataExists = true;
        }
      }

      if (cellDataExists) {
        data.set(tileSortedCells[i], cellData);
      }
    }
  }

  return Array.from(data.values());
}

/**
 * Detects whether a given {@link Tile} is a {@link RasterTile}.
 * @privateRemarks Method of detection is arbitrary, and may be changed.
 */
export function isRasterTile(tile: Tile): tile is RasterTile {
  return !!(tile.data as Record<string, unknown>)?.cells;
}

function isRasterTileVisible(tile: RasterTile): tile is Required<RasterTile> {
  return !!(tile.isVisible && tile.data?.cells?.numericProps);
}

/**
 * Alternative to `quadbin` module's `cellToChildren()` function, modified to
 * return cells in row-major order, NW to SE, as stored in CARTO raster tiles.
 * Sorting after computing cells is too slow.
 */
function cellToChildrenRaster(parent: bigint, resolution: bigint): bigint[] {
  const parentTile = cellToTile(parent);

  // 1. Calculate x/y/z of upper left pixel in raster tile.
  const childZ = Number(resolution);
  const blockSize = 2 ** (childZ - parentTile.z);
  const childBaseX = parentTile.x * blockSize;
  const childBaseY = parentTile.y * blockSize;

  // 2. Iterate pixels in raster tile order; compute cell ID from base x/y.
  const cells: bigint[] = [];
  for (let i = 0, il = blockSize ** 2; i < il; i++) {
    const x = childBaseX + (i % blockSize);
    const y = childBaseY + Math.floor(i / blockSize);
    cells.push(tileToCell({x, y, z: childZ}));
  }

  return cells;
}

/**
 * Returns true if the given value is valid (not NaN, not 'nodata')
 * for the given raster band.
 */
function isValidBandValue(value: unknown, nodata: number): value is number {
  return Number.isNaN(value) ? false : nodata !== value;
}
