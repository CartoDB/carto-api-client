import {aggregationFunctions, aggregate} from './aggregation.js';
import type {AggregationType} from '../types.js';
import type {FeatureData} from '../types-internal.js';
import type {
  CategoryOrderBy,
  CategoryResponseEntry,
  CategoryResponseRaw,
} from '../widget-sources/types.js';

/** @privateRemarks Source: @carto/react-core */
export function groupValuesByColumn({
  data,
  valuesColumns,
  joinOperation,
  keysColumn,
  operation,
  othersThreshold,
  orderBy = 'frequency_desc',
}: {
  data: FeatureData[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  keysColumn: string;
  operation: AggregationType;
  othersThreshold?: number;
  orderBy?: CategoryOrderBy;
}): CategoryResponseRaw | null {
  if (Array.isArray(data) && data.length === 0) {
    return {rows: null};
  }
  const groups = data.reduce((accumulator, item) => {
    const group = item[keysColumn];

    const values = accumulator.get(group) || [];
    accumulator.set(group, values);

    const aggregatedValue = aggregate(item, valuesColumns, joinOperation);

    const isValid =
      (operation === 'count' ? true : aggregatedValue !== null) &&
      aggregatedValue !== undefined;

    if (isValid) {
      values.push(aggregatedValue);
      accumulator.set(group, values);
    }

    return accumulator;
  }, new Map()); // We use a map to be able to maintain the type in the key value

  const targetOperation =
    aggregationFunctions[operation as Exclude<AggregationType, 'custom'>];

  if (!targetOperation) {
    return {rows: []};
  }

  const allCategories = Array.from(groups)
    .map(([name, value]) => ({
      name,
      value: targetOperation(value),
    }))
    .sort(getSorter(orderBy));

  if (othersThreshold && allCategories.length > othersThreshold) {
    const otherValue = allCategories
      .slice(othersThreshold)
      .flatMap(({name}) => groups.get(name));
    return {
      rows: allCategories,
      metadata: {
        others: targetOperation(otherValue),
      },
    };
  }

  return {
    rows: allCategories,
  };
}

export function getSorter(
  orderBy: CategoryOrderBy
): (a: CategoryResponseEntry, b: CategoryResponseEntry) => number {
  switch (orderBy) {
    case 'frequency_asc':
      // 'value ASC, name ASC'
      return (a, b) => a.value - b.value || nameCompare(a.name, b.name);
    case 'frequency_desc':
      // 'value DESC, name ASC'
      return (a, b) => b.value - a.value || nameCompare(a.name, b.name);
    case 'alphabetical_asc':
      // 'name ASC, value DESC'
      return (a, b) => nameCompare(a.name, b.name) || b.value - a.value;
    case 'alphabetical_desc':
      // 'name DESC, value DESC'
      return (a, b) => nameCompare(b.name, a.name) || b.value - a.value;
  }
}

function nameCompare(
  a?: CategoryResponseEntry['name'],
  b?: CategoryResponseEntry['name']
) {
  // Despite the naming of 'alphabetical_*' sort options, we still want to
  // sort numeric category names (usually raster datasets) numerically.
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a ?? 'null').localeCompare(String(b ?? 'null'));
}
