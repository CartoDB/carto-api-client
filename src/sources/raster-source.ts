// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {baseSource} from './base-source.js';
import {getTileFormat} from '../utils/getTileFormat.js';
import {
  WidgetRasterSource,
  type WidgetRasterSourceResult,
} from '../widget-sources/index.js';

import type {
  FilterOptions,
  SourceOptions,
  TilejsonResult,
  TilesetSourceOptions,
} from './types.js';

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
      ...result,
      widgetSource: new WidgetRasterSource({
        ...options,
        tileFormat: getTileFormat(result),
        spatialDataColumn: 'quadbin',
        spatialDataType: 'quadbin',
        spatialDataBounds: result.bounds,
        rasterMetadata: result.raster_metadata!,
      }),
    })
  ) as Promise<RasterSourceResponse>;
};
