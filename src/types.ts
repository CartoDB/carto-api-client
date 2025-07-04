import type {FilterType} from './constants.js';
import type {Polygon, MultiPolygon, Feature} from 'geojson';
import type {BinaryFeature, BinaryFeatureCollection} from '@loaders.gl/schema';

/******************************************************************************
 * MAP INSTANTIATION
 */

/**
 * @privateRemarks Source: @deck.gl/carto
 */
export enum SchemaFieldType {
  Number = 'number',
  Bigint = 'bigint',
  String = 'string',
  Geometry = 'geometry',
  Timestamp = 'timestamp',
  Object = 'object',
  Boolean = 'boolean',
  Variant = 'variant',
  Unknown = 'unknown',
}

/**
 * @privateRemarks Source: @deck.gl/carto
 */
export interface SchemaField {
  name: string;
  type: SchemaFieldType; // Field type in the CARTO stack, common for all providers
}

/******************************************************************************
 * MAPS AND TILES
 */

/** @privateRemarks Source: @deck.gl/carto */
export type Format = 'json' | 'geojson' | 'tilejson';

/** @privateRemarks Source: @carto/constants, @deck.gl/carto */
export type MapType = 'boundary' | 'query' | 'table' | 'tileset' | 'raster';

/** @privateRemarks Source: cloud-native */
export type ProviderType =
  | 'bigquery'
  | 'postgres'
  | 'snowflake'
  | 'redshift'
  | 'databricks'
  | 'carto'
  | 'carto_dw';

/**
 * Alias for GeoJSON 'BBox' type, semantically representing a viewport.
 * Order of values is "west", "south", "east", "north".
 */
export type Viewport = [number, number, number, number];

/**
 * Subset of deck.gl's Tile2DHeader type, containing only the properties
 * required for local widget calculations. Deeper dependencies on deck.gl
 * APIs should be minimized within this library: @deck.gl/carto depends
 * on the API client, not the other way around.
 * @privateRemarks Source: @deck.gl/geo-layers
 */
export type Tile = {
  index: {x: number; y: number; z: number};
  id: string;
  bbox: {west: number; east: number; north: number; south: number};
  isVisible: boolean;
  data?: BinaryFeatureCollection;
};

/** Subset of deck.gl's Tile2DHeader type, for spatial indexes. */
export type SpatialIndexTile = Tile & {
  data?: (Feature & {id: bigint})[];
};

export type RasterTile = Tile & {
  id: string;
  index: {q: bigint; i: string};
  data?: Raster;
};

/** @privateRemarks Source: @deck.gl/carto */
export type Raster = {
  blockSize: number;
  cells: {
    numericProps: BinaryFeature['numericProps'];
    properties: BinaryFeature['properties'];
  };
};

/******************************************************************************
 * AGGREGATION
 */

/**
 * Enum type for the different types of aggregations available for widgets.
 *
 * @privateRemarks Source: @carto/constants
 * @privateRemarks Converted from enum to type union, for improved declarative API.
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

/** @privateRemarks Source: @carto/react-api */
export type SpatialFilter = Polygon | MultiPolygon;

/** @privateRemarks Source: @deck.gl/carto */
export interface Filters {
  [column: string]: Filter;
}

/** @privateRemarks Source: @carto/react-api, @deck.gl/carto */
export interface Filter {
  [FilterType.IN]?: {owner?: string; values: number[] | string[]};
  /** [a, b] both are included. */
  [FilterType.BETWEEN]?: {owner?: string; values: number[][]};
  /** [a, b) a is included, b is not. */
  [FilterType.CLOSED_OPEN]?: {owner?: string; values: number[][]};
  [FilterType.TIME]?: {owner?: string; values: number[][]};
  [FilterType.STRING_SEARCH]?: {
    owner?: string;
    values: string[];
    params?: StringSearchOptions;
  };
}

/** @privateRemarks Source: @carto/react-core */
export type FilterLogicalOperator = 'and' | 'or';

/**
 * Type for minimum or maximum value of an interval. Values 'null' and
 * 'undefined' are intentionally allowed, and represent an unbounded value.
 */
export type FilterIntervalExtremum = number | null | undefined;
export type FilterInterval = [FilterIntervalExtremum, FilterIntervalExtremum];
export type FilterIntervalComplete = [number, number];

export type StringSearchOptions = {
  useRegExp?: boolean;
  mustStart?: boolean;
  mustEnd?: boolean;
  caseSensitive?: boolean;
  keepSpecialCharacters?: boolean;
};

/******************************************************************************
 * GROUPING
 */

/**
 * Defines a step size increment for use with {@link TimeSeriesRequestOptions}.
 *
 * @privateRemarks Source: @carto/react-core
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

/** @privateRemarks Source: @deck.gl/carto */
export type QueryParameterValue =
  | string
  | number
  | boolean
  | Array<QueryParameterValue>
  | object;

/** @privateRemarks Source: @deck.gl/carto */
export type NamedQueryParameter = Record<string, QueryParameterValue>;

/** @privateRemarks Source: @deck.gl/carto */
export type PositionalQueryParameter = QueryParameterValue[];

/** @privateRemarks Source: @deck.gl/carto */
export type QueryParameters = NamedQueryParameter | PositionalQueryParameter;
