import {SpatialFilterPolyfillMode, TileResolution} from '../sources/types';
import {
  GroupDateType,
  SortColumnType,
  SortDirection,
  SpatialFilter,
} from '../types';

/******************************************************************************
 * WIDGET API REQUESTS
 */

export interface ViewState {
  zoom: number;
  latitude: number;
  longitude: number;
}

/** Common options for {@link WidgetBaseSource} requests. */
interface BaseRequestOptions {
  spatialFilter?: SpatialFilter;
  spatialFiltersMode?: SpatialFilterPolyfillMode;
  /** Required for table- and query-based spatial index sources (H3, Quadbin). */
  spatialIndexReferenceViewState?: ViewState;
  abortController?: AbortController;
  filterOwner?: string;
}

/** Options for {@link WidgetBaseSource#getCategories}. */
export interface CategoryRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  operationColumn?: string;
}

/**
 * Options for {@link WidgetBaseSource#getFeatures}.
 * @experimental
 * @internal
 */
export interface FeaturesRequestOptions extends BaseRequestOptions {
  /**
   * Feature IDs, as found in `_carto_feature_id`. Feature IDs are a hash
   * of geometry, and features with identical geometry will have the same
   * feature ID. Order is important; features in the result set will be
   * sorted according to the order of IDs in the request.
   */
  featureIds: string[];

  /**
   * Columns to be returned for each picked object. Note that for datasets
   * containing features with identical geometry, more than one result per
   * requested feature ID may be returned. To match results back to the
   * requested feature ID, include `_carto_feature_id` in the columns list.
   */
  columns: string[];

  /** Topology of objects to be picked. */
  dataType: 'points' | 'lines' | 'polygons';

  /** Zoom level, required if using 'points' data type. */
  z?: number;

  /**
   * Maximum number of objects to return in the result set. For datasets
   * containing features with identical geometry, those features will have
   * the same feature IDs, and so more results may be returned than feature IDs
   * given in the request.
   */
  limit?: number;

  /**
   * Must match `tileResolution` used when obtaining the `_carto_feature_id`
   * column, typically in a layer's tile requests.
   */
  tileResolution?: TileResolution;
}

/** Options for {@link WidgetBaseSource#getFormula}. */
export interface FormulaRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  operationExp?: string;
}

/** Options for {@link WidgetBaseSource#getHistogram}. */
export interface HistogramRequestOptions extends BaseRequestOptions {
  column: string;
  ticks: number[];
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetBaseSource#getRange}. */
export interface RangeRequestOptions extends BaseRequestOptions {
  column: string;
}

/** Options for {@link WidgetBaseSource#getScatter}. */
export interface ScatterRequestOptions extends BaseRequestOptions {
  xAxisColumn: string;
  xAxisJoinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  yAxisColumn: string;
  yAxisJoinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetBaseSource#getTable}. */
export interface TableRequestOptions extends BaseRequestOptions {
  columns: string[];
  sortBy?: string;
  sortDirection?: SortDirection;
  sortByColumnType?: SortColumnType;
  offset?: number;
  limit?: number;
}

/** Options for {@link WidgetBaseSource#getTimeSeries}. */
export interface TimeSeriesRequestOptions extends BaseRequestOptions {
  column: string;
  stepSize?: GroupDateType;
  stepMultiplier?: number;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  operationColumn?: string;
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  splitByCategory?: string;
  splitByCategoryLimit?: number;
  splitByCategoryValues?: string[];
}

/******************************************************************************
 * WIDGET API RESPONSES
 */

/**
 * Response from {@link WidgetBaseSource#getFeatures}.
 * @experimental
 * @internal
 */
export type FeaturesResponse = {rows: Record<string, unknown>[]};

/** Response from {@link WidgetBaseSource#getFormula}. */
export type FormulaResponse = {value: number};

/** Response from {@link WidgetBaseSource#getCategories}. */
export type CategoryResponse = {name: string; value: number}[];

/** Response from {@link WidgetBaseSource#getRange}. */
export type RangeResponse = {min: number; max: number};

/** Response from {@link WidgetBaseSource#getTable}. */
export type TableResponse = {
  totalCount: number;
  rows: Record<string, number | string>[];
};

/** Response from {@link WidgetBaseSource#getScatter}. */
export type ScatterResponse = [number, number][];

/** Response from {@link WidgetBaseSource#getTimeSeries}. */
export type TimeSeriesResponse = {
  rows: {name: string; value: number}[];
  categories: string[];
};

/** Response from {@link WidgetBaseSource#getHistogram}. */
export type HistogramResponse = number[];
