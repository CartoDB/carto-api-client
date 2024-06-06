export enum MAP_TYPES {
  TABLE = 'table',
  QUERY = 'query',
  TILESET = 'tileset',
}

export enum API_VERSIONS {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

/**
 * Enum for the different types of aggregations available for widgets
 * @enum {string}
 * @readonly
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
 */
export const REQUEST_GET_MAX_URL_LENGTH = 2048;

export const DEFAULT_API_BASE_URL = 'https://gcp-us-east1.api.carto.com';
export const DEFAULT_CLIENT = 'deck-gl-carto';
