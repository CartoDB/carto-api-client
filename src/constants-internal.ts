/******************************************************************************
 * VERSIONS
 */

/**
 * Current version of @carto/api-client.
 * @internal
 */
export const API_CLIENT_VERSION = __CARTO_API_CLIENT_VERSION;

/** @internal */
export const V3_MINOR_VERSION = '3.4';

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

/**
 * Fastly default limit is 8192; leave some padding.
 * @internalRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_MAX_LENGTH_URL = 7000;

/**
 * @internalRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_TILE_SIZE = 512;

/**
 * @internalRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_TILE_RESOLUTION = 0.5;

/**
 * @internalRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_AGGREGATION_RES_LEVEL_H3 = 4;

/**
 * @internalRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN = 6;
