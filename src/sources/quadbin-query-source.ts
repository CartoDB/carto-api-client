// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN} from '../constants-internal';
import {WidgetQuerySource, WidgetQuerySourceResult} from '../widget-sources';
import {baseSource} from './base-source';
import type {
  AggregationOptions,
  FilterOptions,
  QuerySourceOptions,
  SourceOptions,
  SpatialDataType,
  TilejsonResult,
} from './types';

export type QuadbinQuerySourceOptions = SourceOptions &
  QuerySourceOptions &
  AggregationOptions &
  FilterOptions;

type UrlParameters = {
  aggregationExp: string;
  aggregationResLevel?: string;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  q: string;
  queryParameters?: Record<string, unknown> | unknown[];
  filters?: Record<string, unknown>;
};

export type QuadbinQuerySourceResponse = TilejsonResult &
  WidgetQuerySourceResult;

export const quadbinQuerySource = async function (
  options: QuadbinQuerySourceOptions
): Promise<QuadbinQuerySourceResponse> {
  const {
    aggregationExp,
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN,
    sqlQuery,
    spatialDataColumn = 'quadbin',
    queryParameters,
    filters,
  } = options;
  const urlParameters: UrlParameters = {
    aggregationExp,
    q: sqlQuery,
    spatialDataColumn,
    spatialDataType: 'quadbin',
  };

  if (aggregationResLevel) {
    urlParameters.aggregationResLevel = String(aggregationResLevel);
  }
  if (queryParameters) {
    urlParameters.queryParameters = queryParameters;
  }
  if (filters) {
    urlParameters.filters = filters;
  }
  return baseSource<UrlParameters>('query', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetQuerySource({
        ...options,
        // NOTE: passing redundant spatialDataColumn here to apply the default value 'quadbin'
        spatialDataColumn,
        spatialDataType: 'quadbin',
      }),
    })
  );
};
