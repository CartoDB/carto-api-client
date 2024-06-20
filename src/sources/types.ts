import {AggregationType, SpatialFilter} from '../types';
import {$TODO} from '../types-internal';

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
  sortBy?: $TODO;
  sortDirection?: $TODO;
  sortByColumnType?: $TODO;
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
  stepSize?: $TODO;
  stepMultiplier?: $TODO;
  operation?: AggregationType;
  operationColumn?: string;
  joinOperation?: AggregationType;
  splitByCategory?: $TODO;
  splitByCategoryLimit?: $TODO;
  splitByCategoryValues?: $TODO;
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
export type RangeResponse = $TODO;
export type TableResponse = {
  hasData: boolean;
  totalCount: number;
  rows: Record<string, number | string>[];
};
export type ScatterResponse = [number, number][];
export type TimeSeriesResponse = $TODO;
export type HistogramResponse = number[];
