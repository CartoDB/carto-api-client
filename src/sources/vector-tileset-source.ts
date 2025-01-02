// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTileFormat} from '../utils/getTileFormat';
import {
  WidgetTilesetSource,
  WidgetTilesetSourceResult,
} from '../widget-sources';
import {baseSource} from './base-source';
import type {
  SourceOptions,
  TilesetSourceOptions,
  TilejsonResult,
} from './types';

export type VectorTilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type VectorTilesetSourceResponse = TilejsonResult &
  WidgetTilesetSourceResult;

export const vectorTilesetSource = async function (
  options: VectorTilesetSourceOptions
): Promise<VectorTilesetSourceResponse> {
  const {tableName} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetTilesetSource({
        ...options,
        tileFormat: getTileFormat(result as TilejsonResult),
      }),
    })
  ) as Promise<VectorTilesetSourceResponse>;
};
