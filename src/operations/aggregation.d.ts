import {AggregationType} from '../types';
import {FeatureData} from '../types-internal';

// TODO: Is this correct?
type AggregationFunction = (
  features: FeatureData[],
  column: string,
  joinOperation?: AggregationType
) => number;

export const aggregationFunctions: Record<AggregationType, AggregationFunction>;

export function aggregate(
  feature: FeatureData,
  keys?: string[],
  joinOperation?: AggregationType
): unknown;
