import {Filter, FilterTypes} from './types.js';
import {FILTER_TYPES} from './constants-internal.js';
import {$TODO} from './types-internal.js';

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
 *
 * @internal
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

type Row<T> = Record<string, T> | Record<string, T>[] | T[] | T;

/**
 * Due to each data warehouse having its own behavior with columns,
 * we need to normalize them and transform every key to lowercase.
 *
 * @internalRemarks Source: @carto/react-widgets
 * @internal
 */
export function normalizeObjectKeys<T, R extends Row<T>>(el: R): R {
  if (Array.isArray(el)) {
    return el.map((value) => normalizeObjectKeys(value)) as R;
  } else if (typeof el !== 'object') {
    return el;
  }

  return Object.entries(el as Record<string, T>).reduce((acc, [key, value]) => {
    acc[key.toLowerCase()] =
      typeof value === 'object' && value ? normalizeObjectKeys(value) : value;
    return acc;
  }, {} as Record<string, T>) as R;
}

/** @internalRemarks Source: @carto/react-core */
export function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @internalRemarks Source: @carto/react-core
 * @internal
 */
export class InvalidColumnError extends Error {
  protected static readonly NAME = 'InvalidColumnError';

  constructor(message: string) {
    super(`${InvalidColumnError.NAME}: ${message}`);
    this.name = InvalidColumnError.NAME;
  }

  static is(error: unknown) {
    return (
      error instanceof InvalidColumnError ||
      (error as Error).message?.includes(InvalidColumnError.NAME)
    );
  }
}
