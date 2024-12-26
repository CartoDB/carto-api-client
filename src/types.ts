import type {FilterType} from './constants.js';
import type {Polygon, MultiPolygon, Feature} from 'geojson';

/******************************************************************************
 * MAPS AND TILES
 */

/** @internalRemarks Source: @deck.gl/carto */
export type Format = 'json' | 'geojson' | 'tilejson';

/** @internalRemarks Source: @carto/constants, @deck.gl/carto */
export type MapType = 'boundary' | 'query' | 'table' | 'tileset' | 'raster';

// TODO(types): Can we remove Viewport or BBox, for internal consistency?

/** @internalRemarks Source: @carto/react-core */
export type Viewport = [number, number, number, number];

/** @internalRemarks Source: @deck.gl/geo-layers */
export type BBox = {west: number; east: number; north: number; south: number};

/** TODO: Documentation. */
export type Tile = {
  index: {x: number; y: number; z: number};
  id: string;
  content: unknown;
  zoom: number;
  boundingBox: [min: number[], max: number[]];
  isVisible: boolean;
  data?: unknown;
};

/** TODO: Documentation. */
export type SpatialIndexTile = Tile & {
  data?: (Feature & {id: bigint})[];
};

type NumericProps = Record<
  string,
  {value: number[] | Float32Array | Float64Array}
>;
type Properties = Record<string, string | number | boolean | null>;

/** TODO: Documentation. */
export type Raster = {
  blockSize: number;
  cells: {
    numericProps: NumericProps;
    properties: Properties[];
  };
};

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
export type SpatialFilter = Polygon | MultiPolygon;

/** @internalRemarks Source: @deck.gl/carto */
export interface Filters {
  [column: string]: Filter;
}

/** @internalRemarks Source: @carto/react-api, @deck.gl/carto */
export interface Filter {
  [FilterType.IN]?: {owner?: string; values: number[] | string[]};
  /** [a, b] both are included. */
  [FilterType.BETWEEN]?: {owner?: string; values: number[][]};
  /** [a, b) a is included, b is not. */
  [FilterType.CLOSED_OPEN]?: {owner?: string; values: number[][]};
  [FilterType.TIME]?: {owner?: string; values: number[][]};
  [FilterType.STRING_SEARCH]?: {owner?: string; values: string[]};
}

/** @internalRemarks Source: @carto/react-core */
export type FilterLogicalOperator = 'and' | 'or';

/**
 * Type for minimum or maximum value of an interval. Values 'null' and
 * 'undefined' are intentionally allowed, and represent an unbounded value.
 */
export type FilterIntervalExtremum = number | null | undefined;
export type FilterInterval = [FilterIntervalExtremum, FilterIntervalExtremum];
export type FilterIntervalComplete = [number, number];

/******************************************************************************
 * GROUPING
 */

/**
 * Defines a step size increment for use with {@link TimeSeriesRequestOptions}.
 *
 * @internalRemarks Source: @carto/react-core
 */
export type GroupDateType =
  | 'year'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second';

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
