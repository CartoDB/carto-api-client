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
  FilterOptions & {
    spatialDataType: 'quadbin';
  };

type UrlParameters = {
  aggregationExp: string;
  aggregationResLevel?: string;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  name: string;
  filters?: Record<string, unknown>;
};

export const quadbinTableSource = async function (
  options: Omit<QuadbinTableSourceOptions, 'spatialDataType'>
): Promise<TilejsonResult & WidgetTableSourceResult> {
  const {
    aggregationExp,
    aggregationResLevel = DEFAULT_AGGREGATION_RES_LEVEL_QUADBIN,
    spatialDataColumn = 'quadbin',
    tableName,
    filters,
  } = options;

  const urlParameters: UrlParameters = {
    aggregationExp,
    name: tableName,
    spatialDataColumn,
    spatialDataType: 'quadbin',
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
        // NOTE: passing redundant spatialDataColumn here to apply the default value 'quadbin'
        spatialDataColumn,
        spatialDataType: 'quadbin'
      }),
    })
  );
};
