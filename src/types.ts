import type {ApiVersion, MapType, FilterType} from './constants';

/******************************************************************************
 * AUTHENTICATION
 */

/** @internalRemarks Source: @carto/react-api */
export type Credentials = {
  apiVersion?: ApiVersion;
  apiBaseUrl?: string;
  geoColumn?: string;
  accessToken: string;
};

/******************************************************************************
 * SOURCES
 */

/** @internalRemarks Source: @carto/react-api */
export type Source = {
  type: MapType;
  connection: string;
  credentials: Credentials;
  data: string;
  geoColumn?: string;
  queryParameters?: unknown[];
  filters?: Record<string, Filter>;
  filtersLogicalOperator?: 'and' | 'or';
};

/******************************************************************************
 * AGGREGATION
 */

/**
 * Enum for the different types of aggregations available for widgets
 * @enum {string}
 * @readonly
 * @internalRemarks Source: @carto/constants
 * @internalRemarks Converted from enum to type union, for improved declarative API.
 */
export type AggregationType =
  | 'count'
  | 'avg'
  | 'min'
  | 'max'
  | 'sum'
  | 'custom';

/******************************************************************************
 * FILTERS
 */

/** @internalRemarks Source: @carto/react-api */
export type SpatialFilter = GeoJSON.Polygon | GeoJSON.MultiPolygon;

/** @internalRemarks Source: @carto/react-api, @deck.gl/carto */
export interface Filter {
  [FilterType.IN]?: {owner?: string; values: number[]};
  /** [a, b] both are included. */
  [FilterType.BETWEEN]?: {owner?: string; values: number[][]};
  /** [a, b) a is included, b is not. */
  [FilterType.CLOSED_OPEN]?: {owner?: string; values: number[][]};
  [FilterType.TIME]?: {owner?: string; values: number[][]};
  [FilterType.STRING_SEARCH]?: {owner?: string; values: string[]};
}

/** @internalRemarks Source: @carto/react-core */
export type FilterLogicalOperator = 'and' | 'or';

/******************************************************************************
 * SORTING
 */

export type SortDirection = 'asc' | 'desc';
export type SortColumnType = 'number' | 'string' | 'date';
