import {
  AggregationType,
  SortColumnType,
  SortDirection,
  SpatialFilter,
} from '../types';

/******************************************************************************
 * WIDGET API REQUESTS
 */

interface BaseRequestOptions {
  spatialFilter?: SpatialFilter;
  abortController?: AbortController;
  filterOwner?: string;
}

export interface FormulaRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: AggregationType;
  operationExp?: string;
}

export interface CategoryRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: AggregationType;
  operationColumn?: string;
}

export interface RangeRequestOptions extends BaseRequestOptions {
  column: string;
}

export interface TableRequestOptions extends BaseRequestOptions {
  columns: string[];
  sortBy?: string;
  sortDirection?: SortDirection;
  sortByColumnType?: SortColumnType;
  page?: number;
  rowsPerPage?: number;
}

export interface ScatterRequestOptions extends BaseRequestOptions {
  xAxisColumn: string;
  xAxisJoinOperation?: AggregationType;
  yAxisColumn: string;
  yAxisJoinOperation?: AggregationType;
}

export interface TimeSeriesRequestOptions extends BaseRequestOptions {
  column: string;
  stepSize?: number;
  stepMultiplier?: number;
  operation?: AggregationType;
  operationColumn?: string;
  joinOperation?: AggregationType;
  splitByCategory?: string;
  splitByCategoryLimit?: number;
  splitByCategoryValues?: string[];
}

export interface HistogramRequestOptions extends BaseRequestOptions {
  column: string;
  ticks: number[];
  operation?: AggregationType;
}

/******************************************************************************
 * WIDGET API RESPONSES
 */

export type FormulaResponse = {value: number};

export type CategoryResponse = {name: string; value: number}[];

export type RangeResponse = {min: number; max: number};

export type TableResponse = {
  totalCount: number;
  rows: Record<string, number | string>[];
};

export type ScatterResponse = [number, number][];

export type TimeSeriesResponse = {
  rows: {name: string; value: number}[];
  categories: string[];
};

export type HistogramResponse = number[];
