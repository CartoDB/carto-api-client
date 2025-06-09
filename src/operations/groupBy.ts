import {aggregationFunctions, aggregate} from './aggregation.js';
import {OTHERS_CATEGORY_NAME} from '../widget-sources/constants.js';
import type {AggregationType} from '../types.js';
import type {FeatureData} from '../types-internal.js';
import type {CategoryResponseRaw} from '../widget-sources/types.js';

/** @privateRemarks Source: @carto/react-core */
export function groupValuesByColumn({
  data,
  valuesColumns,
  joinOperation,
  keysColumn,
  operation,
  othersThreshold,
}: {
  data: FeatureData[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  keysColumn: string;
  operation: AggregationType;
  othersThreshold?: number;
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
    .sort((a, b) => b.value - a.value);

  if (othersThreshold && allCategories.length > othersThreshold) {
    const otherValue = allCategories
      .slice(othersThreshold)
      .flatMap(({name}) => groups.get(name));
    allCategories.push({
      name: OTHERS_CATEGORY_NAME,
      value: targetOperation(otherValue),
    });
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
