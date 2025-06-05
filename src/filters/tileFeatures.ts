import type {
  RasterTile,
  SpatialFilter,
  SpatialIndexTile,
  Tile,
} from '../types.js';
import {tileFeaturesGeometries} from './tileFeaturesGeometries.js';
import {tileFeaturesSpatialIndex} from './tileFeaturesSpatialIndex.js';
import {TileFormat} from '../constants.js';
import {DEFAULT_GEO_COLUMN} from '../constants-internal.js';
import type {FeatureData} from '../types-internal.js';
import type {RasterMetadata, SpatialDataType} from '../sources/types.js';
import {isRasterTile, tileFeaturesRaster} from './tileFeaturesRaster.js';
import {assert} from '../utils.js';

/** @privateRemarks Source: @carto/react-core */
export type TileFeatures = {
  tiles: Tile[];
  tileFormat: TileFormat;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  spatialFilter?: SpatialFilter;
  uniqueIdProperty?: string;
  rasterMetadata?: RasterMetadata;
  storeGeometry?: boolean;
};

/** @privateRemarks Source: @carto/react-core */
export type TileFeatureExtractOptions = {
  storeGeometry?: boolean;
  spatialDataType?: SpatialDataType;
  spatialDataColumn?: string;
  uniqueIdProperty?: string;
};

/** @privateRemarks Source: @carto/react-core */
export function tileFeatures({
  tiles,
  spatialFilter,
  uniqueIdProperty,
  tileFormat,
  spatialDataColumn = DEFAULT_GEO_COLUMN,
  spatialDataType,
  rasterMetadata,
  storeGeometry = false,
}: TileFeatures): FeatureData[] {
  if (spatialDataType === 'geo') {
    return tileFeaturesGeometries({
      tiles,
      tileFormat,
      spatialFilter,
      uniqueIdProperty,
      options: {storeGeometry},
    });
  }

  if (tiles.some(isRasterTile)) {
    assert(rasterMetadata, 'Missing raster metadata');
    return tileFeaturesRaster({
      tiles: tiles as RasterTile[],
      spatialFilter,
      spatialDataColumn,
      spatialDataType,
      rasterMetadata,
    });
  }

  return tileFeaturesSpatialIndex({
    tiles: tiles as SpatialIndexTile[],
    spatialFilter,
    spatialDataColumn,
    spatialDataType,
  });
}
