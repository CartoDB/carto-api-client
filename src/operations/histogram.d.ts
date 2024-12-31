// TODO(types): Check what HistogramFeature is.
import {AggregationType, HistogramFeature} from '../types';
import {FeatureData} from '../types-internal';

export function histogram(args: {
  data: FeatureData[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  ticks: number[];
  operation?: AggregationType;
}): HistogramFeature;
