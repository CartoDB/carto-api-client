/** @internalRemarks Source: @carto/constants */
export enum MAP_TYPES {
  TABLE = 'table',
  QUERY = 'query',
  TILESET = 'tileset',
}

/** @internalRemarks Source: @carto/constants */
export enum API_VERSIONS {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

/**
 * Enum for the different types of aggregations available for widgets
 * @enum {string}
 * @readonly
 * @internalRemarks Source: @carto/constants
 * @internalRemarks TODO(donmccurdy): Consider making this into a type
 *  union rather than an enum, see https://app.shortcut.com/cartoteam/story/417715/add-types-and-jsdoc-for-widget-api-module.
 */
export enum AggregationTypes {
  /** Count */
  COUNT = 'count',

  /** Average */
  AVG = 'avg',

  /** Minimum */
  MIN = 'min',

  /** Maximum */
  MAX = 'max',

  /** Sum */
  SUM = 'sum',

  /** Custom aggregation expression */
  CUSTOM = 'custom',
}

/**
 * Threshold to use GET requests, vs POST
 * @internalRemarks Source: @carto/constants
 */
export const REQUEST_GET_MAX_URL_LENGTH = 2048;

/** @internalRemarks Source: @carto/constants */
export const DEFAULT_API_BASE_URL = 'https://gcp-us-east1.api.carto.com';

/** @internalRemarks Source: @carto/constants */
export const DEFAULT_CLIENT = 'deck-gl-carto';
