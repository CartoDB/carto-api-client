// TODO(types): Check what ScatterPlotFeature is.
import {AggregationType, ScatterPlotFeature} from '../types';
import {FeatureData} from '../types-internal';

export function scatterPlot(args: {
  data: FeatureData[];
  xAxisColumns: string[];
  xAxisJoinOperation?: AggregationType;
  yAxisColumns: string[];
  yAxisJoinOperation?: AggregationType;
}): ScatterPlotFeature;
