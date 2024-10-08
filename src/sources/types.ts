import {
  GroupDateType,
  SortColumnType,
  SortDirection,
  SpatialFilter,
} from '../types';

/******************************************************************************
 * WIDGET API REQUESTS
 */

/** Common options for {@link WidgetBaseSource} requests. */
interface BaseRequestOptions {
  spatialFilter?: SpatialFilter;
  abortController?: AbortController;
  filterOwner?: string;
}

/** Options for {@link WidgetBaseSource#getCategories}. */
export interface CategoryRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  operationColumn?: string;
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
