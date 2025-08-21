import {
  DEFAULT_GEO_COLUMN,
  DEFAULT_TILE_RESOLUTION,
} from '../constants-internal.js';
import {
  WidgetQuerySource,
  type WidgetQuerySourceResult,
} from '../widget-sources/index.js';
import {baseSource} from './base-source.js';
import type {
  SourceOptions,
  QuerySourceOptions,
  SpatialDataType,
  TilejsonResult,
  ColumnsOption,
} from './types.js';

export type TrajectoryQuerySourceOptions = SourceOptions &
  QuerySourceOptions &
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
  q: string;
  queryParameters?: Record<string, unknown> | unknown[];
  aggregationExp?: string;
  trajectoryIdColumn: string;
  timestampColumn: string;
};

export type TrajectoryQuerySourceResponse = TilejsonResult &
  WidgetQuerySourceResult & {
    getTimeRange(): Promise<{min: number; max: number} | null>;
  };

export const trajectoryQuerySource = async function (
  options: TrajectoryQuerySourceOptions
): Promise<TrajectoryQuerySourceResponse> {
  const {
    columns,
    spatialDataColumn = DEFAULT_GEO_COLUMN,
    sqlQuery,
    tileResolution = DEFAULT_TILE_RESOLUTION,
    queryParameters,
    aggregationExp,
    trajectoryIdColumn,
    timestampColumn,
  } = options;

  const spatialDataType = 'trajectory';

  const urlParameters: UrlParameters = {
    spatialDataColumn,
    spatialDataType,
    tileResolution: tileResolution.toString(),
    q: sqlQuery,
    trajectoryIdColumn,
    timestampColumn,
  };

  if (columns) {
    urlParameters.columns = columns.join(',');
  }
  if (queryParameters) {
    urlParameters.queryParameters = queryParameters;
  }
  if (aggregationExp) {
    urlParameters.aggregationExp = aggregationExp;
  }

  return baseSource<UrlParameters>('query', options, urlParameters).then(
    (result) => {
      const widgetSource = new WidgetQuerySource({
        ...options,
        // NOTE: Parameters with default values above must be explicitly passed here.
        spatialDataColumn,
        spatialDataType,
        tileResolution,
      });
      
      return {
        ...result,
        widgetSource,
        getTimeRange(): Promise<{min: number; max: number} | null> {
          return widgetSource.getRange({column: timestampColumn});
        },
      };
    }
  );
};
