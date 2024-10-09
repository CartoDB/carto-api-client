/** Current version of @carto/api-client. */
export const API_CLIENT_VERSION = __CARTO_API_CLIENT_VERSION;

export const DEFAULT_API_BASE_URL = 'https://gcp-us-east1.api.carto.com';
export const DEFAULT_CLIENT = 'deck-gl-carto';
export const V3_MINOR_VERSION = '3.4';

// Fastly default limit is 8192; leave some padding.
export const DEFAULT_MAX_LENGTH_URL = 7000;

export const DEFAULT_TILE_SIZE = 512;
export const DEFAULT_TILE_RESOLUTION = 0.5;

export const DEFAULT_AGGREGATION_RES_LEVEL_H3 = 4;
export const DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN = 6;

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
