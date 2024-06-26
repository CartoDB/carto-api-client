/**
 * Defines a step size increment for use with {@link TimeSeriesRequestOptions}.
 *
 * @internalRemarks Source: @carto/react-core
 */
export enum GroupDateType {
  YEARS = 'year',
  MONTHS = 'month',
  WEEKS = 'week',
  DAYS = 'day',
  HOURS = 'hour',
  MINUTES = 'minute',
  SECONDS = 'second',
}

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
