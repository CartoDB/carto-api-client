import type {API_VERSIONS, MAP_TYPES} from './constants';

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

/** @internalRemarks Source: @carto/react-api */
export type Credentials = {
  apiVersion: API_VERSIONS;
  apiBaseUrl: string;
  geoColumn: string;
  accessToken: string;
};

/** @internalRemarks Source: @carto/react-api */
export type Source = {
  type: MAP_TYPES;
  connection: string;
  credentials: Credentials;
  data: string;
  geoColumn?: string;
  queryParameters?: unknown[];
  filters?: Record<string, Filter>;
  filtersLogicalOperator?: 'and' | 'or';
};

/** @internalRemarks Source: @carto/react-api, @deck.gl/carto */
export enum FilterTypes {
  In = 'in',
  Between = 'between', // [a, b] both are included
  ClosedOpen = 'closed_open', // [a, b) a is included, b is not
  Time = 'time',
  StringSearch = 'stringSearch',
}

/** @internalRemarks Source: @carto/react-api, @deck.gl/carto */
export interface Filter {
  [FilterTypes.In]: number[];
  [FilterTypes.Between]: number[][];
  [FilterTypes.ClosedOpen]: number[][];
  [FilterTypes.Time]: number[][];
  [FilterTypes.StringSearch]: string[];
}

export type FilterLogicalOperator = 'and' | 'or';
