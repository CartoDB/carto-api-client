/******************************************************************************
 * DEFAULTS
 */

/**
 * @internalRemarks Source: @carto/constants
 * @internal
 */
export const DEFAULT_API_BASE_URL = 'https://gcp-us-east1.api.carto.com';

/**
 * @internalRemarks Source: @carto/constants
 * @internal
 */
export const DEFAULT_CLIENT = 'deck-gl-carto';

/**
 * @internalRemarks Source: @carto/react-api
 * @internal
 */
export const DEFAULT_GEO_COLUMN = 'geom';

/******************************************************************************
 * ENUMS
 */

/**
 * @internal
 * @internalRemarks Source: @carto/constants
 */
export enum MapType {
  TABLE = 'table',
  QUERY = 'query',
  TILESET = 'tileset',
}

/**
 * @internal
 * @internalRemarks Source: @carto/constants
 */
export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}
