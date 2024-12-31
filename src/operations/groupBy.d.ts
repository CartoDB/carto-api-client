import {AggregationType} from '../types';
import {FeatureData} from '../types-internal';
import {GroupByFeature} from './types';

export function groupValuesByColumn(args: {
  data: FeatureData[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  keysColumn?: string;
  operation?: AggregationType;
}): GroupByFeature;
