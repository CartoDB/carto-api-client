import {
  FilterLogicalOperator,
  Filters,
  MapType,
  QueryParameters,
  SpatialFilter,
} from './types';
import {DEFAULT_API_BASE_URL} from './constants';
import {
  DEFAULT_GEO_COLUMN,
  DEFAULT_TILE_RESOLUTION,
} from './constants-internal';
import {TileResolution} from './sources/types';
import {getClient} from './client';
import {APIErrorContext, requestWithParameters} from './api';
import {assignOptions} from './utils';
import {buildPickingUrl} from './api/endpoints';

/** @internal */
export type BasePickingOptions = {
  /** TODO */
  accessToken: string;

  /** TODO */
  connectionName: string;

  /** TODO */
  apiBaseUrl?: string;

  /** TODO */
  clientId?: string;

  /** Source type. */
  type: 'table' | 'query';

  /**
   * Feature IDs, as found in `_carto_feature_id`. Feature IDs are a hash
   * of geometry, and features with identical geometry will have the same
   * feature ID. Order is important; features in the result set will be
   * sorted according to the order of IDs in the request.
   */
  featureIds: string[];

  /**
   * Columns to be returned for each picked object. Note that for datasets
   * containing features with identical geometry, more than one result per
   * requested feature ID may be returned. To match results back to the
   * requested feature ID, include `_carto_feature_id` in the columns list.
   */
  columns: string[];

  /** Topology of objects to be picked. */
  dataType: 'points' | 'lines' | 'polygons';

  /** Required for points, otherwise optional. */
  z?: number;

  /**
   * Maximum number of objects to return in the result set. For datasets
   * containing features with identical geometry, those features will have
   * the same feature IDs, and so more results may be returned than feature IDs
   * given in the request.
   */
  limit?: number;

  /**
   * Must match `tileResolution` used when obtaining the `_carto_feature_id`
   * column, typically in a layer's tile requests.
   */
  tileResolution?: TileResolution;

  /** TODO */
  queryParameters?: QueryParameters;

  /**
   * Optional filters applied before picking, to improve performance and limit
   * results.
   */
  filters?: Filters;

  /** TODO */
  filtersLogicalOperator?: FilterLogicalOperator;

  /**
   * Optional spatial filter applied before picking to improve performance.
   */
  spatialFilters?: SpatialFilter;

  /** Spatial data column, default is 'geom'. */
  spatialDataColumn?: string;
};

/** @internal */
export type TablePickingOptions = BasePickingOptions & {
  type: 'table';
  tableName: string;
};

/** @internal */
export type QueryPickingOptions = BasePickingOptions & {
  type: 'query';
  sqlQuery: string;
};

/** @internal */
export type PickObjectsRequest = TablePickingOptions | QueryPickingOptions;

const PICKING_DEFAULTS = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  clientId: getClient(),
  limit: 1000,
  tileResolution: DEFAULT_TILE_RESOLUTION,
  spatialDataColumn: DEFAULT_GEO_COLUMN,
};

/** @internal */
export type PickObjectsResponse = {
  rows: Record<string, unknown>[];
  meta: {
    cacheHit: boolean;
    totalBytesProcessed: string;
    location: string;
  };
};

type PickObjectsRequestInternal = {
  type: MapType;
  client: string;
  source: string;
  params: {
    columns: string[];
    dataType: 'points' | 'lines' | 'polygons';
    featureIds: string[];
    limit: number;
    tileResolution: number;
  };
  queryParameters?: unknown;
  filters?: Filters;
  filtersLogicalOperator?: FilterLogicalOperator;
  spatialFilters?: SpatialFilter;
  spatialDataType: 'geo';
  spatialDataColumn: string;
};

/** @internal */
export async function pickObjects(
  options: PickObjectsRequest
): Promise<PickObjectsResponse> {
  const {accessToken, apiBaseUrl, connectionName, clientId, ...rest} =
    assignOptions<PickObjectsRequest & typeof PICKING_DEFAULTS>(
      {...PICKING_DEFAULTS},
      options
    );

  const baseUrl = buildPickingUrl({apiBaseUrl, connectionName});
  const headers = {Authorization: `Bearer ${options.accessToken}`};
  const parameters: PickObjectsRequestInternal = {
    type: rest.type,
    client: clientId,
    source: rest.type === 'table' ? rest.tableName : rest.sqlQuery,
    params: {
      columns: rest.columns,
      dataType: rest.dataType,
      featureIds: rest.featureIds,
      limit: rest.limit,
      tileResolution: rest.tileResolution,
    },
    queryParameters: rest.queryParameters,
    filters: rest.filters,
    filtersLogicalOperator: rest.filtersLogicalOperator,
    spatialFilters: rest.spatialFilters,
    spatialDataType: 'geo',
    spatialDataColumn: rest.spatialDataColumn,
  };
  const errorContext: APIErrorContext = {
    requestType: 'SQL',
    connection: connectionName,
    type: rest.type,
    source: JSON.stringify(parameters, undefined, 2),
  };

  return requestWithParameters<PickObjectsResponse>({
    baseUrl,
    parameters,
    headers,
    errorContext,
  });
}
