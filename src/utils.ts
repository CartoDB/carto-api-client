import {FILTER_TYPES} from './constants.js';
import {$TODO} from './types-internal.js';
import {Filter, FilterTypes} from './vendor/carto-react-api.js';

/**
 * @privateRemarks In C4R, this logic occurs in `useWidgetSource` and is termed
 * `getApplicableFilters`. Keep these terms in mind for public API?
 *
 * ```javascript
 *   const applicableFilters = useMemo(
 *      () => getApplicableFilters(rawSource?.filters, id),
 *      [rawSource?.filters, id]
 *   );
 * ```
 */
export function getWidgetFilters(
  owner?: string,
  allFilters?: Record<string, Filter>
): Record<string, Filter> {
  if (!allFilters) return {};
  if (!owner) return allFilters;

  const widgetFilters: Record<string, Filter> = {};

  for (const column in allFilters) {
    for (const type in allFilters[column]) {
      if (!FILTER_TYPES.has(type as FilterTypes)) continue;

      const filter = (allFilters as $TODO)[column][type];
      if (filter && filter.owner !== owner) {
        widgetFilters[column] = allFilters[column];
      }
    }
  }

  return widgetFilters;
}
