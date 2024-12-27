// TODO(types): Check what ScatterPlotFeature is.
import {AggregationType, ScatterPlotFeature} from '../types';

export function scatterPlot(args: {
  data: Record<string, unknown>[];
  xAxisColumns: string[];
  xAxisJoinOperation?: AggregationType;
  yAxisColumns: string[];
  yAxisJoinOperation?: AggregationType;
}): ScatterPlotFeature;
