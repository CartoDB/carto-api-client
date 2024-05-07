import { Filter, FilterTypes } from "./vendor/deck-carto";

export function sleep (ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getWidgetFilters(owner: string, allFilters?: Record<string, Filter>): Record<string, Filter> {
  if (!allFilters) return {};

  const widgetFilters: Record<string, Filter> = {};
  for (const column in allFilters) {
    for (const type in FilterTypes) {
      const filter = allFilters[column][type];
      if (filter && filter.owner !== owner) {
        widgetFilters[column] = allFilters[column];
      }
    }
  }

  return widgetFilters;
}
