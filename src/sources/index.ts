// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Import all source functions
import {boundaryQuerySource} from './boundary-query-source.js';
import {boundaryTableSource} from './boundary-table-source.js';
import {h3QuerySource} from './h3-query-source.js';
import {h3TableSource} from './h3-table-source.js';
import {h3TilesetSource} from './h3-tileset-source.js';
import {quadbinQuerySource} from './quadbin-query-source.js';
import {quadbinTableSource} from './quadbin-table-source.js';
import {quadbinTilesetSource} from './quadbin-tileset-source.js';
import {rasterSource} from './raster-source.js';
import {trajectoryQuerySource} from './trajectory-query-source.js';
import {trajectoryTableSource} from './trajectory-table-source.js';
import {vectorQuerySource} from './vector-query-source.js';
import {vectorTableSource} from './vector-table-source.js';
import {vectorTilesetSource} from './vector-tileset-source.js';

export {SOURCE_DEFAULTS} from './base-source.js';
export {RasterBandColorinterp} from './constants.js';
export type {
  SourceOptions,
  SourceRequiredOptions,
  SourceOptionalOptions,
  TilejsonResult,
  QueryResult,
  FilterOptions,
  QuerySourceOptions,
  TableSourceOptions,
  TilesetSourceOptions,
  ColumnsOption,
  SpatialDataType,
  SpatialFilterPolyfillMode,
  TileResolution,
  Tilejson,
  Tilestats,
  Layer,
  Attribute,
  VectorLayer,
  RasterMetadata,
  RasterMetadataBand,
  RasterMetadataBandStats,
  RasterBandType,
} from './types.js';

export {boundaryQuerySource};
export type {
  BoundaryQuerySourceOptions,
  BoundaryQuerySourceResponse,
} from './boundary-query-source.js';

export {boundaryTableSource};
export type {
  BoundaryTableSourceOptions,
  BoundaryTableSourceResponse,
} from './boundary-table-source.js';

export {h3QuerySource};
export type {
  H3QuerySourceOptions,
  H3QuerySourceResponse,
} from './h3-query-source.js';

export {h3TableSource};
export type {
  H3TableSourceOptions,
  H3TableSourceResponse,
} from './h3-table-source.js';

export {h3TilesetSource};
export type {
  H3TilesetSourceOptions,
  H3TilesetSourceResponse,
} from './h3-tileset-source.js';

export {rasterSource};
export type {RasterSourceOptions} from './raster-source.js';

export {quadbinQuerySource};
export type {
  QuadbinQuerySourceOptions,
  QuadbinQuerySourceResponse,
} from './quadbin-query-source.js';

export {quadbinTableSource};
export type {
  QuadbinTableSourceOptions,
  QuadbinTableSourceResponse,
} from './quadbin-table-source.js';

export {quadbinTilesetSource};
export type {
  QuadbinTilesetSourceOptions,
  QuadbinTilesetSourceResponse,
} from './quadbin-tileset-source.js';

export {vectorQuerySource};
export type {
  VectorQuerySourceOptions,
  VectorQuerySourceResponse,
} from './vector-query-source.js';

export {vectorTableSource};
export type {
  VectorTableSourceOptions,
  VectorTableSourceResponse,
} from './vector-table-source.js';

export {vectorTilesetSource};
export type {
  VectorTilesetSourceOptions,
  VectorTilesetSourceResponse,
} from './vector-tileset-source.js';

export {trajectoryQuerySource};
export type {
  TrajectoryQuerySourceOptions,
  TrajectoryQuerySourceResponse,
} from './trajectory-query-source.js';

export {trajectoryTableSource};
export type {
  TrajectoryTableSourceOptions,
  TrajectoryTableSourceResponse,
} from './trajectory-table-source.js';

export const CARTO_SOURCES = {
  boundaryQuerySource,
  boundaryTableSource,
  h3QuerySource,
  h3TableSource,
  h3TilesetSource,
  quadbinQuerySource,
  quadbinTableSource,
  quadbinTilesetSource,
  rasterSource,
  trajectoryQuerySource,
  trajectoryTableSource,
  vectorQuerySource,
  vectorTableSource,
  vectorTilesetSource,
};
