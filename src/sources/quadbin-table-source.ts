// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN} from '../constants-internal';
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

export type QuadbinTableSourceOptions = SourceOptions &
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

export type QuadbinTableSourceResponse = TilejsonResult &
  WidgetTableSourceResult;

export const quadbinTableSource = async function (
  options: QuadbinTableSourceOptions
): Promise<QuadbinTableSourceResponse> {
  const {
    aggregationExp,
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN,
    spatialDataColumn = 'quadbin',
    tableName,
    filters,
  } = options;

  const spatialDataType = 'quadbin';

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
