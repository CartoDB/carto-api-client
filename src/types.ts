import type {FilterType} from './constants';

/******************************************************************************
 * AGGREGATION
 */

/**
 * Enum for the different types of aggregations available for widgets.
 *
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

/******************************************************************************
 * SQL QUERY PARAMETERS
 */

/** @internalRemarks Source: @deck.gl/carto */
export type QueryParameterValue =
  | string
  | number
  | boolean
  | Array<QueryParameterValue>
  | object;

/** @internalRemarks Source: @deck.gl/carto */
export type NamedQueryParameter = Record<string, QueryParameterValue>;

/** @internalRemarks Source: @deck.gl/carto */
export type PositionalQueryParameter = QueryParameterValue[];

/** @internalRemarks Source: @deck.gl/carto */
export type QueryParameters = NamedQueryParameter | PositionalQueryParameter;
