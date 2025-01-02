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
  TilejsonResult,
  TilesetSourceOptions,
} from './types';
import {SpatialIndex} from '../constants.js';

export type H3TilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type H3TilesetSourceResponse = TilejsonResult &
  WidgetTilesetSourceResult;

export const h3TilesetSource = async function (
  options: H3TilesetSourceOptions
): Promise<H3TilesetSourceResponse> {
  const {tableName} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetTilesetSource({
        ...options,
        tileFormat: getTileFormat(result as TilejsonResult),
        spatialIndex: SpatialIndex.H3,
      }),
    })
  ) as Promise<H3TilesetSourceResponse>;
};
