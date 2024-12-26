// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { WidgetTilesetSource, WidgetTilesetSourceResult } from '../widget-sources';
import {baseSource} from './base-source';
import type {
  SourceOptions,
  TilejsonResult,
  TilesetSourceOptions,
} from './types';

export type H3TilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export const h3TilesetSource = async function (
  options: H3TilesetSourceOptions
): Promise<TilejsonResult & WidgetTilesetSourceResult> {
  const {tableName} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>(
    'tileset',
    options,
    urlParameters
  ).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetTilesetSource(options),
    })
  );
};
