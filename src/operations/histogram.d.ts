// TODO(types): Check what HistogramFeature is.
import {AggregationType, HistogramFeature} from '../types';

export function histogram(args: {
  data: Record<string, unknown>[];
  valuesColumns?: string[];
  joinOperation?: AggregationType;
  ticks: number[];
  operation?: AggregationType;
}): HistogramFeature;
