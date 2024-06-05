import {MapViewState, WebMercatorViewport} from '@deck.gl/core';
import {Filter, FilterTypes} from './vendor/deck-carto.js';
import {FILTER_TYPES} from './constants.js';
import {$TODO} from './types-internal.js';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export function getSpatialFilter(viewState: MapViewState): any {
  const viewport = new WebMercatorViewport(viewState);
  return {
    type: 'Polygon',
    coordinates: [
      [
        viewport.unproject([0, 0]),
        viewport.unproject([viewport.width, 0]),
        viewport.unproject([viewport.width, viewport.height]),
        viewport.unproject([0, viewport.height]),
        viewport.unproject([0, 0]),
      ],
    ],
  };
}
