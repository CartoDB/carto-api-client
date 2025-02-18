import {SpatialFilter, SpatialIndexTile, Tile} from '../types';
import {tileFeaturesGeometries} from './tileFeaturesGeometries';
import {tileFeaturesSpatialIndex} from './tileFeaturesSpatialIndex';
import {TileFormat} from '../constants';
import {DEFAULT_GEO_COLUMN} from '../constants-internal';
import {FeatureData} from '../types-internal';
import {SpatialDataType} from '../sources/types';

/** @privateRemarks Source: @carto/react-core */
export type TileFeatures = {
  tiles: Tile[];
  tileFormat: TileFormat;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  spatialFilter: SpatialFilter;
  uniqueIdProperty?: string;
  options?: TileFeatureExtractOptions;
};

/** @privateRemarks Source: @carto/react-core */
export type TileFeatureExtractOptions = {
  storeGeometry?: boolean;
};

/** @privateRemarks Source: @carto/react-core */
export function tileFeatures({
  tiles,
  spatialFilter,
  uniqueIdProperty,
  tileFormat,
  spatialDataColumn = DEFAULT_GEO_COLUMN,
  spatialDataType,
  options = {},
}: TileFeatures): FeatureData[] {
  if (spatialDataType !== 'geo') {
    return tileFeaturesSpatialIndex({
      tiles: tiles as SpatialIndexTile[],
      spatialFilter,
      spatialDataColumn,
      spatialDataType,
    });
  }
  return tileFeaturesGeometries({
    tiles,
    tileFormat,
    spatialFilter,
    uniqueIdProperty,
    options,
  });
}
