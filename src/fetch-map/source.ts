import type {Dataset} from './types.js';
import {SpatialIndex, SpatialIndexColumn} from '../constants.js';
import type {
  QuerySourceOptions,
  TableSourceOptions,
  TilejsonResult,
  TileResolution,
} from '../sources/types.js';
import {
  DEFAULT_AGGREGATION_EXP,
  DEFAULT_AGGREGATION_RES_LEVEL_H3,
  DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN,
  DEFAULT_TILE_RESOLUTION,
  REDUCED_QUERIES_TILE_RESOLUTION,
} from '../constants-internal.js';
import {
  h3QuerySource,
  type H3QuerySourceOptions,
  h3TableSource,
  type H3TableSourceOptions,
  quadbinQuerySource,
  type QuadbinQuerySourceOptions,
  quadbinTableSource,
  type QuadbinTableSourceOptions,
  rasterSource,
  vectorQuerySource,
  type VectorQuerySourceOptions,
  vectorTableSource,
  type VectorTableSourceOptions,
  vectorTilesetSource,
  type VectorTilesetSourceOptions,
} from '../sources/index.js';
import type {Filter} from '../types.js';

type FetchDatasetOptions = {
  accessToken: string;
  apiBaseUrl: string;
  connection: string;
  headers?: Record<string, string>;
  localCache?: {
    cacheControl: 'no-cache'[];
  };
  maxLengthURL?: number;
  tags?: Record<string, string>;
};

type FetchDataset = {
  dataset: Dataset;
  filters?: Filter;
  options: FetchDatasetOptions;
};

// Copy of getCartoSource from cloud-native:
// https://github.com/CartoDB/cloud-native/blob/main/workspace-www/src/features/common/utils/cartoDeckGL.ts#L79
export function configureSource({
  dataset,
  filters,
  options,
}: FetchDataset): Promise<TilejsonResult> {
  const {
    geoColumn,
    columns,
    type,
    source,
    queryParameters,
    aggregationExp,
    aggregationResLevel: originalAggregationResLevel,
  } = dataset;
  const sourceOptions = getSourceOptions(options);
  const spatialDataColumn = getColumnNameFromGeoColumn(geoColumn) || undefined;
  const spatialIndex = geoColumn
    ? getSpatialIndexFromGeoColumn(geoColumn)
    : undefined;
  const tileResolution = getDynamicTileResolution(spatialIndex);
  const isH3 = spatialIndex === SpatialIndex.H3;
  const isQuadbin = spatialIndex === SpatialIndex.QUADBIN;
  let aggregationResLevel = originalAggregationResLevel;

  if (typeof originalAggregationResLevel !== 'number' && isH3) {
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_H3;
  } else if (typeof originalAggregationResLevel !== 'number' && isQuadbin) {
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN;
  }

  const spatialIndexOptions = {
    aggregationExp: !aggregationExp ? DEFAULT_AGGREGATION_EXP : aggregationExp,
    aggregationResLevel: scaleAggregationResLevel(
      aggregationResLevel,
      tileResolution
    ),
    spatialDataColumn,
    ...(filters && {filters}),
  } as H3QuerySourceOptions;
  const tilesetOptions = {
    ...sourceOptions,
    tableName: source,
  } as VectorTilesetSourceOptions;
  const tableOptions = {
    ...sourceOptions,
    tableName: source,
    tileResolution,
  } as TableSourceOptions;
  const queryOptions = {
    ...sourceOptions,
    sqlQuery: source,
    tileResolution,
    ...(queryParameters && {queryParameters}),
  } as QuerySourceOptions;
  const vectorOptions = {
    spatialDataColumn,
    ...(columns && {columns}),
    ...(filters && {filters}),
    ...(aggregationExp && {aggregationExp}),
  } as VectorTableSourceOptions;

  if (type === 'raster') {
    return rasterSource({
      ...sourceOptions,
      tableName: source,
      ...(filters && {filters: filters as any}),
    });
  }
  if (type === 'tileset') {
    return vectorTilesetSource({...tilesetOptions});
  }

  if (type === 'table') {
    if (isH3) {
      return h3TableSource({
        ...(tableOptions as H3TableSourceOptions),
        ...spatialIndexOptions,
      });
    } else if (isQuadbin) {
      return quadbinTableSource({
        ...(tableOptions as QuadbinTableSourceOptions),
        ...spatialIndexOptions,
      });
    } else {
      return vectorTableSource({
        ...(tableOptions as VectorTableSourceOptions),
        ...vectorOptions,
      });
    }
  }

  if (type === 'query') {
    if (isH3) {
      return h3QuerySource({
        ...(queryOptions as H3QuerySourceOptions),
        ...spatialIndexOptions,
      });
    } else if (isQuadbin) {
      return quadbinQuerySource({
        ...(queryOptions as QuadbinQuerySourceOptions),
        ...spatialIndexOptions,
      });
    } else {
      return vectorQuerySource({
        ...(queryOptions as VectorQuerySourceOptions),
        ...vectorOptions,
      });
    }
  }
  throw new Error(`Invalid source type: ${type}`);
}

function getSourceOptions({
  accessToken,
  apiBaseUrl,
  connection,
  headers,
  maxLengthURL,
  tags,
}: FetchDatasetOptions) {
  return {
    accessToken,
    connectionName: connection,
    apiBaseUrl,
    headers,
    maxLengthURL,
    ...(headers?.['Cache-Control']?.includes('no-cache') && {
      localCache: {
        cacheControl: ['no-cache'] as 'no-cache'[],
      },
    }),
    tags,
  };
}

/**
 * Returns default tile resolution for dynamic tilesets, based on layer configuration
 * Result is not applicable for static tilesets, for which tile resolution is defined
 * by tilejson.
 */
function getDynamicTileResolution(
  spatialIndex?: SpatialIndex | null
): TileResolution {
  // TODO: Support increased tile size and resolution for dynamic H3 spatial indexes.
  if (spatialIndex !== SpatialIndex.H3) {
    return REDUCED_QUERIES_TILE_RESOLUTION;
  }

  return DEFAULT_TILE_RESOLUTION;
}

/**
 * @internal
 * State of `aggregationResLevel` in the UI and backend config is based on an assumption of
 * 512x512px tiles. Because we may change tile resolution for performance goals, the
 * `aggregationResLevel` passed to the deck.gl layer must be scaled with tile resolution.
 */
export function scaleAggregationResLevel(
  aggregationResLevel: number,
  tileResolution: number
): number | undefined {
  if (typeof aggregationResLevel !== 'number') return;
  return aggregationResLevel - Math.log2(0.5 / tileResolution);
}

/**
 * @internal
 */
export function getColumnNameFromGeoColumn(
  geoColumn: string | null | undefined
) {
  if (!geoColumn) {
    return geoColumn;
  }
  const parts = geoColumn.split(':');
  return parts.length === 1 ? parts[0] : parts.length === 2 ? parts[1] : null;
}

/**
 * @internal
 */
export function getSpatialIndexFromGeoColumn(geoColumn: string) {
  const spatialIndexToSearch = geoColumn.split(':')[0];

  for (const index of Object.values(SpatialIndex)) {
    if (SpatialIndexColumn[index].includes(spatialIndexToSearch)) {
      return index;
    }
  }
  return null;
}
