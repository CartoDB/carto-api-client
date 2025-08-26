import {
  DEFAULT_GEO_COLUMN,
  DEFAULT_TILE_RESOLUTION,
} from '../constants-internal.js';
import {
  WidgetTableSource,
  type RangeResponse,
  type WidgetTableSourceResult,
} from '../widget-sources/index.js';
import {baseSource} from './base-source.js';
import type {
  ColumnsOption,
  SourceOptions,
  SpatialDataType,
  TableSourceOptions,
  TilejsonResult,
} from './types.js';

export type TrajectoryTableSourceOptions = SourceOptions &
  TableSourceOptions &
  ColumnsOption & {
    /** Column name containing the trajectory identifier */
    trajectoryIdColumn: string;
    /** Column name containing the timestamp */
    timestampColumn: string;
  };

type UrlParameters = {
  columns?: string;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  tileResolution?: string;
  name: string;
  aggregationExp?: string;
  trajectoryIdColumn: string;
  timestampColumn: string;
};

export type TrajectoryTableSourceResponse = TilejsonResult &
  WidgetTableSourceResult & {
    timestampRange: RangeResponse;
  };

export const trajectoryTableSource = async function (
  options: TrajectoryTableSourceOptions
): Promise<TrajectoryTableSourceResponse> {
  const {
    columns,
    spatialDataColumn = DEFAULT_GEO_COLUMN,
    tableName,
    tileResolution = DEFAULT_TILE_RESOLUTION,
    aggregationExp,
    trajectoryIdColumn,
    timestampColumn,
  } = options;

  const spatialDataType = 'trajectory';

  const urlParameters: UrlParameters = {
    name: tableName,
    spatialDataColumn,
    spatialDataType,
    tileResolution: tileResolution.toString(),
    trajectoryIdColumn,
    timestampColumn,
  };

  if (columns) {
    urlParameters.columns = columns.join(',');
  }
  if (aggregationExp) {
    urlParameters.aggregationExp = aggregationExp;
  }

  const result = await baseSource<UrlParameters>(
    'table',
    options,
    urlParameters
  );

  const widgetSource = new WidgetTableSource({
    ...options,
    // NOTE: Parameters with default values above must be explicitly passed here.
    spatialDataColumn,
    spatialDataType,
    tileResolution,
  });

  const timestampRange = await widgetSource.getRange({column: timestampColumn});

  return {
    ...result,
    widgetSource,
    timestampRange,
  };
};
