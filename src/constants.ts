/** Current version of @carto/api-client. */
export const API_CLIENT_VERSION = __CARTO_API_CLIENT_VERSION;

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
