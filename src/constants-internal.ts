/** @internal */
export const V3_MINOR_VERSION = '3.4';

/** @privateRemarks Source: @carto/constants, @deck.gl/carto */
export const DEFAULT_GEO_COLUMN = 'geom';

/**
 * Fastly default limit is 8192; leave some padding.
 * @privateRemarks Source: @deck.gl/carto
 */
export const DEFAULT_MAX_LENGTH_URL = 7000;

/** @privateRemarks Source: @deck.gl/carto */
export const DEFAULT_TILE_RESOLUTION = 0.5;

/**
 * @todo TODO(v0.5): Update DEFAULT_TILE_RESOLUTION and remove this constant.
 * @internal
 */
export const REDUCED_QUERIES_TILE_RESOLUTION = 1;

/**
 * @privateRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_AGGREGATION_RES_LEVEL_H3 = 4;

/**
 * @privateRemarks Source: @deck.gl/carto
 * @internal
 */
export const DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN = 6;

/** @internal */
export const DEFAULT_AGGREGATION_EXP_ALIAS = '__aggregationValue';
export const DEFAULT_AGGREGATION_EXP = `1 AS ${DEFAULT_AGGREGATION_EXP_ALIAS}`;
