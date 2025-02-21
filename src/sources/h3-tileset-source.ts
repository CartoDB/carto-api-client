// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTileFormat} from '../utils/getTileFormat.js';
import {
  WidgetTilesetSource,
  WidgetTilesetSourceResult,
  WidgetTilesetWorkerSource,
} from '../widget-sources/index.js';
import {isModuleWorkerSupported} from '../workers/utils.js';
import {baseSource} from './base-source.js';
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

  const WidgetSourceClass =
    options.widgetSourceWorker !== false && isModuleWorkerSupported()
      ? WidgetTilesetWorkerSource
      : WidgetTilesetSource;

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetSourceClass({
        ...options,
        tileFormat: getTileFormat(result as TilejsonResult),
        spatialDataColumn,
        spatialDataType: 'h3',
      }),
    })
  ) as Promise<H3TilesetSourceResponse>;
};
