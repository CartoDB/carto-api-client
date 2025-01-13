// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {DEFAULT_AGGREGATION_RES_LEVEL_H3} from '../constants-internal';
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

export type H3QuerySourceOptions = SourceOptions &
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

export type H3QuerySourceResponse = TilejsonResult & WidgetQuerySourceResult;

export const h3QuerySource = async function (
  options: H3QuerySourceOptions
): Promise<H3QuerySourceResponse> {
  const {
    aggregationExp,
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_H3,
    sqlQuery,
    spatialDataColumn = 'h3',
    queryParameters,
    filters,
  } = options;

  const spatialDataType = 'h3';

  const urlParameters: UrlParameters = {
    aggregationExp,
    spatialDataColumn,
    spatialDataType,
    q: sqlQuery,
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
        // NOTE: Parameters with default values above must be explicitly passed here.
        spatialDataColumn,
        spatialDataType,
      }),
    })
  );
};
