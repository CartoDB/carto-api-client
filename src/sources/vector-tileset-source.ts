// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DEFAULT_GEO_COLUMN} from '../constants-internal.js';
import {getTileFormat} from '../utils/getTileFormat.js';
import {
  WidgetTilesetSourceResult,
  WidgetTilesetWorkerSource,
} from '../widget-sources/index.js';
import {baseSource} from './base-source.js';
import type {
  SourceOptions,
  TilesetSourceOptions,
  TilejsonResult,
} from './types.js';

export type VectorTilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type VectorTilesetSourceResponse = TilejsonResult &
  WidgetTilesetSourceResult;

export const vectorTilesetSource = async function (
  options: VectorTilesetSourceOptions
): Promise<VectorTilesetSourceResponse> {
  const {tableName, spatialDataColumn = DEFAULT_GEO_COLUMN} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>('tileset', options, urlParameters).then(
    (result) => ({
      ...(result as TilejsonResult),
      widgetSource: new WidgetTilesetWorkerSource({
        ...options,
        tileFormat: getTileFormat(result as TilejsonResult),
        spatialDataColumn,
        spatialDataType: 'geo',
      }),
    })
  ) as Promise<VectorTilesetSourceResponse>;
};
