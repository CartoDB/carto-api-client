// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {baseSource} from './base-source.js';
import {getTileFormat} from '../utils/getTileFormat.js';
import {
  WidgetTilesetSource,
  type WidgetTilesetSourceResult,
} from '../widget-sources/index.js';
import type {
  SourceOptions,
  TilejsonResult,
  TilesetSourceOptions,
} from './types.js';

export type H3TilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type H3TilesetSourceResponse = TilejsonResult &
  WidgetTilesetSourceResult;

export const h3TilesetSource = async function (
  options: H3TilesetSourceOptions
): Promise<H3TilesetSourceResponse> {
  const {tableName, spatialDataColumn = 'h3'} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...result,
      widgetSource: new WidgetTilesetSource({
        ...options,
        tileFormat: getTileFormat(result),
        spatialDataColumn,
        spatialDataType: 'h3',
        spatialDataBounds: result.bounds,
      }),
    })
  ) as Promise<H3TilesetSourceResponse>;
};
