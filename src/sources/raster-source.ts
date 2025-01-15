// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTileFormat} from '../utils/getTileFormat';
import {WidgetRasterSource, WidgetRasterSourceResult} from '../widget-sources';
import {baseSource} from './base-source';
import type {
  FilterOptions,
  SourceOptions,
  TilejsonResult,
  TilesetSourceOptions,
} from './types';

export type RasterSourceOptions = SourceOptions &
  TilesetSourceOptions &
  FilterOptions;
type UrlParameters = {
  name: string;
  filters?: Record<string, unknown>;
};

export type RasterSourceResponse = TilejsonResult & WidgetRasterSourceResult;

export const rasterSource = async function (
  options: RasterSourceOptions
): Promise<RasterSourceResponse> {
  const {tableName, filters} = options;
  const urlParameters: UrlParameters = {name: tableName};
  if (filters) {
    urlParameters.filters = filters;
  }

  return baseSource<UrlParameters>('raster', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetRasterSource({
        ...options,
        // TODO: ???
        tileFormat: getTileFormat(result as TilejsonResult),
        spatialDataColumn: 'quadbin',
        spatialDataType: 'quadbin',
      }),
    })
  ) as Promise<RasterSourceResponse>;
};
