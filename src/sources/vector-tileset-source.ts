// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {baseSource} from './base-source';
import type {
  SourceOptions,
  TilesetSourceOptions,
  TilejsonResult,
} from './types';

export type VectorTilesetSourceOptions = SourceOptions & TilesetSourceOptions;
type UrlParameters = {name: string};

export type VectorTilesetSourceResponse = TilejsonResult;

export const vectorTilesetSource = async function (
  options: VectorTilesetSourceOptions
): Promise<VectorTilesetSourceResponse> {
  const {tableName} = options;
  const urlParameters: UrlParameters = {name: tableName};

  return baseSource<UrlParameters>(
    'tileset',
    options,
    urlParameters
  ) as Promise<VectorTilesetSourceResponse>;
};
