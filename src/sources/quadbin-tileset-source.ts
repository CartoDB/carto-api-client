// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  WidgetTilesetSource,
  WidgetTilesetSourceResult,
} from '../widget-sources';
import {baseSource} from './base-source';
import type {
  SourceOptions,
  TilejsonResult,
  TilesetSourceOptions,
} from './types';

export type QuadbinTilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type QuadbinTilesetSourceResponse = TilejsonResult &
  WidgetTilesetSourceResult;

export const quadbinTilesetSource = async function (
  options: QuadbinTilesetSourceOptions
): Promise<QuadbinTilesetSourceResponse> {
  const {tableName} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetTilesetSource(options),
    })
  ) as Promise<QuadbinTilesetSourceResponse>;
};
