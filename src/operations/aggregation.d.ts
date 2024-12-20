import {AggregationType} from '../types';

// TODO: Is this correct?
type AggregationFunction = (
  features: Record<string, unknown>[],
  column: string,
  joinOperation?: AggregationType
) => number;

export const aggregationFunctions: Record<AggregationType, AggregationFunction>;

export function aggregate(
  feature: Record<string, unknown>,
  keys?: string[],
  joinOperation?: AggregationType
): unknown;
