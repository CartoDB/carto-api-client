import {
  cellToChildren as _cellToChildren,
  cellToTile,
  geometryToCells,
  getResolution,
} from 'quadbin';
import {RasterTile, SpatialFilter, Tile} from '../types';
import {FeatureData} from '../types-internal';
import {
  RasterMetadata,
  RasterMetadataBand,
  SpatialDataType,
} from '../sources/types';

export type TileFeaturesRasterOptions = {
  tiles: RasterTile[];
  spatialFilter: SpatialFilter;
  spatialDataColumn: string;
  spatialDataType: SpatialDataType;
  rasterMetadata: RasterMetadata;
};

export function tileFeaturesRaster({
  tiles,
  ...options
}: TileFeaturesRasterOptions): FeatureData[] {
  // Cache band metadata for faster lookup while iterating over pixels.
  const bandMetadataByName: Record<string, RasterMetadataBand> = {};
  for (const band of options.rasterMetadata.bands) {
    bandMetadataByName[band.name] = band;
  }

  // Omit empty and invisible tiles for simpler processing and types.
  tiles = tiles.filter(isRasterTileVisible);
  if (tiles.length === 0) return [];

  // Raster tiles, and all pixels, are quadbin cells. Resolution of a pixel is
  // the resolution of the tile, plus the number of subdivisions. Block size
  // must be square, N x N, where N is a power of two.
  const tileResolution = getResolution(tiles[0].index.q as bigint);
  const tileBlockSize = tiles[0].data!.blockSize;
  const cellResolution = tileResolution + BigInt(Math.log2(tileBlockSize));

  // Compute covering cells for the spatial filter, at same resolution as the
  // raster pixels, to be used as a mask.
  const spatialFilterCells = new Set(
    geometryToCells(options.spatialFilter, cellResolution)
  );

  const data = new Map<bigint, FeatureData>();

  for (const tile of tiles as Required<RasterTile>[]) {
    const parent = tile.index.q as bigint;

    const children = cellToChildrenSorted(parent, cellResolution);

    // For each pixel/cell within the spatial filter, create a FeatureData.
    // Order is row-major, starting from NW and ending at SE.
    for (let i = 0; i < children.length; i++) {
      if (!spatialFilterCells.has(children[i])) continue;

      const cellData: FeatureData = {};
      let cellDataExists = false;

      for (const band in tile.data.cells.numericProps) {
        const value = tile.data.cells.numericProps[band].value[i];
        // TODO(cleanup): nodata should not be a number, not a string.
        if (Number(bandMetadataByName[band].nodata) !== value) {
          cellData[band] = tile.data!.cells.numericProps[band].value[i];
          cellDataExists = true;
        }
      }

      if (cellDataExists) {
        data.set(children[i], cellData);
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
  return tile.data ? tile.data.hasOwnProperty('cells') : false;
}

function isRasterTileVisible(tile: RasterTile): tile is Required<RasterTile> {
  return !!(tile.isVisible && tile.data?.cells?.numericProps);
}

/**
 * For the raster format, children are sorted in row-major order, starting from
 * NW and ending at SE. Order returned by quadbin's cellToChildren() is not
 * defined (and not related to the raster format), so sort explicitly here.
 */
function cellToChildrenSorted(parent: bigint, resolution: bigint): bigint[] {
  return _cellToChildren(parent, resolution).sort(
    (cellA: bigint, cellB: bigint) => {
      const tileA = cellToTile(cellA);
      const tileB = cellToTile(cellB);
      if (tileA.y !== tileB.y) {
        return tileA.y > tileB.y ? 1 : -1;
      }
      return tileA.x > tileB.x ? 1 : -1;
    }
  );
}
