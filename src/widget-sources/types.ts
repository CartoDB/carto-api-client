import type {BBox} from 'geojson';
import type {
  SpatialFilterPolyfillMode,
  TileResolution,
} from '../sources/types.js';
import type {
  AggregationType,
  Filters,
  GroupDateType,
  SortColumnType,
  SortDirection,
  SpatialFilter,
} from '../types.js';

/******************************************************************************
 * WIDGET API REQUESTS
 */

export interface ViewState {
  zoom: number;
  latitude: number;
  longitude: number;
}

/** Common options for {@link WidgetRemoteSource} requests. */
export interface BaseRequestOptions {
  signal?: AbortSignal;
  spatialFilter?: SpatialFilter;
  spatialFiltersMode?: SpatialFilterPolyfillMode;
  /** Overrides source filters, if any. */
  filters?: Filters;
  filterOwner?: string;
}

export type CategoryOrderBy =
  | 'frequency_asc' // sort by aggregate value ascending, then by name ascending
  | 'frequency_desc' // sort by aggregate value descending, then by name ascending
  | 'alphabetical_asc' // sort by category name ascending, then by value descending
  | 'alphabetical_desc'; // sort by category name descending, then by value descending

/**
 * Examples:
 *   * population by state
 *      * column: 'state'
 *      * operation: 'sum'
 *      * operationColumn: 'population'
 *   * average salary by department
 *      * column: 'department'
 *      * operation: 'avg'
 *      * operationColumn: 'salary'
 *   * custom aggregation by storetype
 *      * column: 'storetype'
 *      * operation: 'custom'
 *      * operationExp: 'sum(sales)/sum(area)'
 *
 * Options for {@link WidgetRemoteSource#getCategories}.
 */
export interface CategoryRequestOptions extends BaseRequestOptions {
  /** The column that to categorize by. */
  column: string;
  /** The type of aggregation to apply on data in scope of each category. */
  operation: AggregationType;
  /** Remote only. Only valid if operation is 'custom' */
  operationExp?: string;
  /** The aggregated column per each category. */
  operationColumn?: string;
  /** Local only. */
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  /** Calculate `_carto_others` category for all categories after first N (N is threshold). */
  othersThreshold?: number;
  /**
   * Order categories by frequency or alphabetically.
   * @default 'frequency_desc'
   */
  orderBy?: CategoryOrderBy;
  /** Return raw result (CategoryResponseRaw). */
  rawResult?: boolean;
}

/**
 * Options for {@link WidgetRemoteSource#getFeatures}.
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

/**
 * Examples:
 *   * sum of all sales
 *      * column: 'sales'
 *      * operation: 'sum'
 *   * average salary
 *      * column: 'salary'
 *      * operation: 'avg'
 *   * custom aggregation over all rows
 *      * operation: 'custom'
 *      * operationExp: 'sum(sales)/sum(area)'
 *
 * Options for {@link WidgetRemoteSource#getFormula}.
 */
export interface FormulaRequestOptions extends BaseRequestOptions {
  /** The column to apply the aggregation operation on. Not needed for 'custom' operation. */
  column?: string;
  /** The type of aggregation to apply on data. */
  operation: AggregationType;
  /** Remote only. Only valid if operation is 'custom' */
  operationExp?: string;
  /** Local only. */
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetRemoteSource#getHistogram}. */
export interface HistogramRequestOptions extends BaseRequestOptions {
  column: string;
  ticks: number[];
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  /** Local only. */
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetRemoteSource#getRange}. */
export interface RangeRequestOptions extends BaseRequestOptions {
  column: string;
}

/** Options for {@link WidgetRemoteSource#getScatter}. */
export interface ScatterRequestOptions extends BaseRequestOptions {
  xAxisColumn: string;
  xAxisJoinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  yAxisColumn: string;
  yAxisJoinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetRemoteSource#getTable}. */
export interface TableRequestOptions extends BaseRequestOptions {
  columns: string[];
  sortBy?: string;
  sortDirection?: SortDirection;
  sortByColumnType?: SortColumnType;
  offset?: number;
  limit?: number;
  /** @deprecated Supported for tilesets only. Prefer `filters` (for all sources) instead. */
  searchFilterColumn?: string;
  /** @deprecated Supported for tilesets only. Prefer `filters` (for all sources) instead. */
  searchFilterText?: string;
}

/**
 * Examples:
 *   * sum of all sales by month
 *      * column: 'sales'
 *      * stepSize: 'month'
 *      * operation: 'sum'
 *   * average salary by year
 *      * column: 'salary'
 *      * stepSize: 'year'
 *      * operation: 'avg'
 * Options for {@link WidgetRemoteSource#getTimeSeries}.
 */
export interface TimeSeriesRequestOptions extends BaseRequestOptions {
  column: string;
  stepSize: GroupDateType;
  stepMultiplier?: number;
  operation: AggregationType;
  /** Remote only. Only valid if operation is 'custom' */
  operationExp?: string;
  operationColumn?: string;
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  splitByCategory?: string;
  splitByCategoryLimit?: number;
  splitByCategoryValues?: string[];
}

/**
 * Examples:
 *   * aggregations with array syntax
 *      * aggregations: [{column: 'pop_high', operation: 'sum', alias: 'high_pop'}, {column: 'pop_low', operation: 'avg'}]
 *   * aggregations with string syntax
 *      * aggregations: 'sum(pop_high) as high_pop, avg(pop_low) as avg_low'
 *
 * Options for {@link WidgetRemoteSource#getAggregations}.
 */
export interface AggregationsRequestOptions extends BaseRequestOptions {
  /** Aggregations to compute. Can be an array of objects or a SQL string expression. */
  aggregations:
    | {
        column: string;
        operation: Exclude<AggregationType, 'custom'>;
        alias: string;
      }[]
    | string;
}

/** @experimental */
export type ExtentRequestOptions = BaseRequestOptions;

/******************************************************************************
 * WIDGET API RESPONSES
 */

/**
 * Response from {@link WidgetRemoteSource#getFeatures}.
 * @experimental
 * @internal
 */
export type FeaturesResponse = {rows: Record<string, unknown>[]};

/** Response from {@link WidgetRemoteSource#getFormula}. */
export type FormulaResponse = {value: number | null};

/** Entry in the category widget response, see  {@link WidgetRemoteSource#getCategories}. */
export type CategoryResponseEntry = {
  name: string | number | null;
  value: number;
};

/** Response from {@link WidgetRemoteSource#getCategories}. */
export type CategoryResponse = CategoryResponseEntry[];

export type CategoryResponseRaw = {
  rows: CategoryResponseEntry[] | null;
  metadata?: {
    others?: number;
  };
};

/** Response from {@link WidgetRemoteSource#getRange}. */
export type RangeResponse =
  | {min: number; max: number}
  | {min: string; max: string}
  | null;

/** Response from {@link WidgetRemoteSource#getTable}. */
export type TableResponse = {
  totalCount: number;
  rows: Record<string, number | string>[];
};

/** Response from {@link WidgetRemoteSource#getScatter}. */
export type ScatterResponse = [number, number][];

/** Response from {@link WidgetRemoteSource#getTimeSeries}. */
export type TimeSeriesResponse = {
  rows: {name: string; value: number}[];
  categories?: string[];
};

/** Response from {@link WidgetRemoteSource#getHistogram}. */
export type HistogramResponse = number[];

/** Response from {@link WidgetRemoteSource#getAggregations}. */
export type AggregationsResponse = {
  rows: Record<string, number | string | null>[];
};

/** @experimental */
export type ExtentResponse = {bbox: BBox};
