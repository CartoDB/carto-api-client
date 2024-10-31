/**
 * Defines a comparator used when matching a column's values against given filter values.
 *
 * Example:
 *
 * ```javascript
 * import { FilterType } from '@carto/api-client';
 * const filters = {
 *   column_name: { [FilterType.IN]: { values: ['a', 'b', 'c'] } }
 * };
 * ```
 *
 * @internalRemarks Source: @carto/react-api, @deck.gl/carto
 */
export enum FilterType {
  IN = 'in',
  /** [a, b] both are included. */
  BETWEEN = 'between',
  /** [a, b) a is included, b is not. */
  CLOSED_OPEN = 'closed_open',
  TIME = 'time',
  STRING_SEARCH = 'stringSearch',
}

/** @internalRemarks Source: @carto/constants */
export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

/******************************************************************************
 * DEFAULTS
 */

/** @internalRemarks Source: @carto/constants, @deck.gl/carto */
export const DEFAULT_API_BASE_URL = 'https://gcp-us-east1.api.carto.com';

/** @internalRemarks Source: @carto/constants, @deck.gl/carto */
export const DEFAULT_GEO_COLUMN = 'geom';

/**
 * Fastly default limit is 8192; leave some padding.
 * @internalRemarks Source: @deck.gl/carto
 */
export const DEFAULT_MAX_LENGTH_URL = 7000;

/** @internalRemarks Source: @deck.gl/carto */
export const DEFAULT_TILE_SIZE = 512;

/** @internalRemarks Source: @deck.gl/carto */
export const DEFAULT_TILE_RESOLUTION = 0.5;
