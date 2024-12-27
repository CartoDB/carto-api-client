import {AggregationType} from '../types';
import {GroupByFeature} from './types';

export function groupValuesByColumn(args: {
  data: Record<string, unknown>[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  keysColumn?: string;
  operation?: AggregationType;
}): GroupByFeature;
