import {AggregationType, GroupDateType} from '../types.js';
import {getUTCMonday} from '../utils/dateUtils.js';
import {aggregate, aggregationFunctions} from './aggregation.js';
import {GroupByFeature} from './types.js';

const GROUP_KEY_FN_MAPPING: Record<GroupDateType, (date: Date) => number> = {
  year: (date: Date) => Date.UTC(date.getUTCFullYear()),
  month: (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth()),
  week: (date: Date) => getUTCMonday(date),
  day: (date: Date) =>
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  hour: (date: Date) =>
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours()
    ),
  minute: (date: Date) =>
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes()
    ),
  second: (date: Date) =>
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ),
};

export function groupValuesByDateColumn({
  data,
  valuesColumns,
  joinOperation,
  keysColumn,
  groupType,
  operation,
}: {
  data: Record<string, unknown>[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  keysColumn?: string;
  groupType?: GroupDateType;
  operation?: AggregationType;
}): GroupByFeature | null {
  if (Array.isArray(data) && data.length === 0) {
    return null;
  }

  // @ts-expect-error TODO(cleanup)
  const groupKeyFn = GROUP_KEY_FN_MAPPING[groupType];

  if (!groupKeyFn) {
    return null;
  }

  const groups = data.reduce((acc, item) => {
    // @ts-expect-error TODO(cleanup)
    const value = item[keysColumn];
    const formattedValue = new Date(value);
    const groupKey = groupKeyFn(formattedValue);

    if (!isNaN(groupKey)) {
      let groupedValues = acc.get(groupKey);
      if (!groupedValues) {
        groupedValues = [];
        acc.set(groupKey, groupedValues);
      }

      const aggregatedValue = aggregate(item, valuesColumns, joinOperation);

      const isValid = aggregatedValue !== null && aggregatedValue !== undefined;

      if (isValid) {
        groupedValues.push(aggregatedValue);
        acc.set(groupKey, groupedValues);
      }
    }

    return acc;
  }, new Map());

  // @ts-expect-error TODO(cleanup)
  const targetOperation = aggregationFunctions[operation];

  if (targetOperation) {
    return [...groups.entries()]
      .map(([name, value]) => ({
        name,
        value: targetOperation(value),
      }))
      .sort((a, b) => a.name - b.name);
  }

  return [];
}
