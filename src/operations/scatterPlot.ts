import {aggregate} from './aggregation';
import {FeatureData} from '../types-internal';
import {AggregationType} from '../types';

export type ScatterPlotFeature = [number, number][];

/**
 * Filters invalid features and formats  data.
 * @internalRemarks Source: @carto/react-core
 */
export function scatterPlot({
  data,
  xAxisColumns,
  xAxisJoinOperation,
  yAxisColumns,
  yAxisJoinOperation,
}: {
  data: FeatureData[];
  xAxisColumns: string[];
  xAxisJoinOperation?: AggregationType;
  yAxisColumns: string[];
  yAxisJoinOperation?: AggregationType;
}): ScatterPlotFeature {
  return data.reduce((acc, feature) => {
    const xValue = aggregate(
      feature,
      xAxisColumns,
      xAxisJoinOperation
    ) as number;

    const xIsValid = xValue !== null && xValue !== undefined;

    const yValue = aggregate(
      feature,
      yAxisColumns,
      yAxisJoinOperation
    ) as number;

    const yIsValid = yValue !== null && yValue !== undefined;

    if (xIsValid && yIsValid) {
      acc.push([xValue, yValue]);
    }

    return acc;
  }, [] as [number, number][]);
}