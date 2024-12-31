import {SpatialFilter, SpatialIndexTile, Tile} from '../types';
import {tileFeaturesGeometries} from './tileFeaturesGeometries';
import {tileFeaturesSpatialIndex} from './tileFeaturesSpatialIndex';
import {SpatialIndex, TileFormat} from '../constants';
import {DEFAULT_GEO_COLUMN} from '../constants-internal';
import {FeatureData} from '../types-internal';

export type TileFeatureOptions = {
  tiles?: Tile[];
  spatialFilter?: SpatialFilter;
  uniqueIdProperty?: string;
  tileFormat: TileFormat;
  spatialDataColumn?: string;
  spatialIndex?: SpatialIndex;
  options?: TileFeatureExtractOptions;
};

export type TileFeatureExtractOptions = {
  storeGeometry?: boolean;
};

export function tileFeatures({
  tiles,
  spatialFilter,
  uniqueIdProperty,
  tileFormat,
  spatialDataColumn = DEFAULT_GEO_COLUMN,
  spatialIndex,
  options = {},
}: TileFeatureOptions): FeatureData[] {
  // TODO(api): SpatialFilter should either be a required parameter, or
  // omitting it should be valid (no filtering).
  if (!spatialFilter) {
    return [];
  }

  if (spatialIndex) {
    return tileFeaturesSpatialIndex({
      tiles: tiles as SpatialIndexTile[],
      spatialFilter,
      spatialDataColumn,
      spatialIndex,
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
