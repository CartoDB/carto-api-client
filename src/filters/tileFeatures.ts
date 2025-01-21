import {RasterTile, SpatialFilter, SpatialIndexTile, Tile} from '../types';
import {tileFeaturesGeometries} from './tileFeaturesGeometries';
import {tileFeaturesSpatialIndex} from './tileFeaturesSpatialIndex';
import {SpatialIndex, TileFormat} from '../constants';
import {DEFAULT_GEO_COLUMN} from '../constants-internal';
import {FeatureData} from '../types-internal';
import {SpatialDataType} from '../sources/types';
import {
  getResolution,
  cellToBoundary,
  geometryToCells,
  cellToChildren,
  bigIntToHex,
} from 'quadbin';
import {Feature} from 'geojson';

/** @internalRemarks Source: @carto/react-core */
export type TileFeatures = {
  tiles: Tile[];
  tileFormat: TileFormat;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  spatialFilter?: SpatialFilter;
  uniqueIdProperty?: string;
  options?: TileFeatureExtractOptions;
};

/** @internalRemarks Source: @carto/react-core */
export type TileFeatureExtractOptions = {
  storeGeometry?: boolean;
};

/** @internalRemarks Source: @carto/react-core */
export function tileFeatures({
  tiles,
  spatialFilter,
  uniqueIdProperty,
  tileFormat,
  spatialDataColumn = DEFAULT_GEO_COLUMN,
  spatialDataType,
  options = {},
}: TileFeatures): FeatureData[] {
  // TODO(cleanup): Is an empty response the expected result when spatialFilter
  // is omitted? Why not make the parameter required, or return the full input?
  if (!spatialFilter) {
    return [];
  }

  if (spatialDataType === 'geo') {
    return tileFeaturesGeometries({
      tiles,
      tileFormat,
      spatialFilter,
      uniqueIdProperty,
      options,
    });
  }

  if (tiles.some(isRasterTile)) {
    // TODO(DO NOT SUBMIT): Remove profiling.
    console.time('raster to quadbin conversion');
    tiles = (tiles as RasterTile[]).map(convertRasterTileToSpatialIndexTile);
    console.timeEnd('raster to quadbin conversion');
  }

  // TODO(DO NOT SUBMIT): Remove profiling.
  console.time('extract tile features');
  try {
    return tileFeaturesSpatialIndex({
      tiles: tiles as SpatialIndexTile[],
      spatialFilter,
      spatialDataColumn,
      spatialDataType,
    });
  } finally {
    console.timeEnd('extract tile features');
  }
}

function isRasterTile(tile: Tile): tile is RasterTile {
  return tile.data ? tile.data.hasOwnProperty('cells') : false;
}

function convertRasterTileToSpatialIndexTile(
  tile: RasterTile
): SpatialIndexTile {
  const parent = tile.index.q as bigint;
  const blockSize = tile.data!.blockSize as number;

  // Raster tiles, and all pixels, are quadbin cells. Resolution of a pixel is
  // the resolution of the tile, plus the number of subdivisions. Block size
  // must be square, N x N, where N is a power of two.
  const resolution = getResolution(parent) + BigInt(Math.log2(blockSize));
  const children = cellToChildren(parent, resolution);

  const cells: {id: bigint; properties: Feature['properties']}[] = [];

  // TODO(DO NOT SUBMIT): Confirm that order of cells returned by 'quadbin-js'
  // is the same as the order stored in tiles.
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
  return {...tile, data: cells} as SpatialIndexTile;
}
