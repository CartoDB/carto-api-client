// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {DEFAULT_AGGREGATION_RES_LEVEL_H3} from '../constants-internal';
import {WidgetTableSource, WidgetTableSourceResult} from '../widget-sources';
import {baseSource} from './base-source';
import type {
  AggregationOptions,
  FilterOptions,
  SourceOptions,
  SpatialDataType,
  TableSourceOptions,
  TilejsonResult,
} from './types';

export type H3TableSourceOptions = SourceOptions &
  TableSourceOptions &
  AggregationOptions &
  FilterOptions;

type UrlParameters = {
  aggregationExp: string;
  aggregationResLevel?: string;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  name: string;
  filters?: Record<string, unknown>;
};

export type H3TableSourceResponse = TilejsonResult & WidgetTableSourceResult;

export const h3TableSource = async function (
  options: H3TableSourceOptions
): Promise<H3TableSourceResponse> {
  const {
    aggregationExp,
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_H3,
    spatialDataColumn = 'h3',
    tableName,
    filters,
  } = options;

  const spatialDataType = 'h3';

  const urlParameters: UrlParameters = {
    aggregationExp,
    name: tableName,
    spatialDataColumn,
    spatialDataType,
  };

  if (aggregationResLevel) {
    urlParameters.aggregationResLevel = String(aggregationResLevel);
  }
  if (filters) {
    urlParameters.filters = filters;
  }

  return baseSource<UrlParameters>('table', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetTableSource({
        ...options,
        // NOTE: Parameters with default values above must be explicitly passed here.
        spatialDataColumn,
        spatialDataType,
      }),
    })
  );
};
