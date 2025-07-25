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

export type QuadbinTilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type QuadbinTilesetSourceResponse = TilejsonResult &
  WidgetTilesetSourceResult;

export const quadbinTilesetSource = async function (
  options: QuadbinTilesetSourceOptions
): Promise<QuadbinTilesetSourceResponse> {
  const {tableName, spatialDataColumn = 'quadbin'} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...result,
      widgetSource: new WidgetTilesetSource({
        ...options,
        tileFormat: getTileFormat(result),
        spatialDataColumn,
        spatialDataType: 'quadbin',
        spatialDataBounds: result.bounds,
      }),
    })
  ) as Promise<QuadbinTilesetSourceResponse>;
};
