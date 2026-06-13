// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DEFAULT_GEO_COLUMN,
  DEFAULT_TILE_RESOLUTION,
} from '../constants-internal.js';
import {
  WidgetTableSource,
  type WidgetTableSourceResult,
} from '../widget-sources/index.js';
import {baseSource} from './base-source.js';
import type {
  FilterOptions,
  ColumnsOption,
  SourceOptions,
  SpatialDataType,
  TableSourceOptions,
  TilejsonResult,
} from './types.js';

export type VectorTableSourceOptions = SourceOptions &
  TableSourceOptions &
  FilterOptions &
  ColumnsOption & {
    /**
     * If `true`, the server includes a `_carto_bbox` property on each polygon
     * feature, containing the bounding box of the full (unclipped) geometry as
     * a `"west,south,east,north"` string in WGS84. Used by clients to compute
     * stable label positions for polygons that span multiple tiles.
     */
    featureBbox?: boolean;
    /**
     * Opt into the small-source fast path. When `true` and the source is small
     * enough, the server collapses it to a single full-resolution z0 tile
     * (tilejson `maxzoom: 0`, tile URLs carry `full=true`) instead of a pyramid
     * — one warehouse query ever, CDN-shared, then zero warehouse work on
     * pan/zoom.
     *
     * The consumer MUST be able to slice that one tile locally per zoom (see
     * `isFullSourceTilejson` / `buildFullTileIndex` / `sliceFullTile`); without
     * a slicer, deck.gl's native overzoom draws every feature at every zoom and
     * low-zoom density blows up. No-op on sources the server can't size cheaply
     * (e.g. query sources) — the tilejson then comes back as a normal pyramid.
     */
    fullTiles?: boolean;
  };

type UrlParameters = {
  columns?: string;
  filters?: Record<string, unknown>;
  spatialDataType: SpatialDataType;
  spatialDataColumn?: string;
  tileResolution?: string;
  name: string;
  aggregationExp?: string;
  featureBbox?: boolean;
  fullTiles?: boolean;
};

export type VectorTableSourceResponse = TilejsonResult &
  WidgetTableSourceResult;

export const vectorTableSource = async function (
  options: VectorTableSourceOptions
): Promise<VectorTableSourceResponse> {
  const {
    columns,
    filters,
    spatialDataColumn = DEFAULT_GEO_COLUMN,
    tableName,
    tileResolution = DEFAULT_TILE_RESOLUTION,
    aggregationExp,
    featureBbox,
    fullTiles,
  } = options;

  const spatialDataType = 'geo';

  const urlParameters: UrlParameters = {
    name: tableName,
    spatialDataColumn,
    spatialDataType,
    tileResolution: tileResolution.toString(),
  };

  if (columns) {
    urlParameters.columns = columns.join(',');
  }
  if (filters) {
    urlParameters.filters = filters;
  }
  if (aggregationExp) {
    urlParameters.aggregationExp = aggregationExp;
  }
  if (featureBbox) {
    urlParameters.featureBbox = true;
  }
  if (fullTiles) {
    urlParameters.fullTiles = true;
  }

  return baseSource<UrlParameters>('table', options, urlParameters).then(
    (result) => ({
      ...result,
      widgetSource: new WidgetTableSource({
        ...options,
        // NOTE: Parameters with default values above must be explicitly passed here.
        spatialDataColumn,
        spatialDataType,
        tileResolution,
      }),
    })
  );
};
