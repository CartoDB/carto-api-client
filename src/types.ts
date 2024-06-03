import {AggregationTypes} from './vendor/carto-constants.js';
import {$TODO} from './types-internal';
import {SpatialFilter} from './vendor/carto-react-api';
import {Filter} from './vendor/deck-carto';

/******************************************************************************
 * FILTERS
 */

export interface FilterEvent extends CustomEvent {
  detail: {filters: Record<string, Filter>};
}

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
  operation?: AggregationTypes;
  operationExp?: string;
}

export interface CategoryRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: AggregationTypes;
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
  xAxisJoinOperation?: AggregationTypes;
  yAxisColumn: string;
  yAxisJoinOperation?: AggregationTypes;
}

export interface TimeSeriesRequestOptions extends BaseRequestOptions {
  column: string;
  stepSize?: $TODO;
  stepMultiplier?: $TODO;
  operation?: AggregationTypes;
  operationColumn?: string;
  joinOperation?: AggregationTypes;
  splitByCategory?: $TODO;
  splitByCategoryLimit?: $TODO;
  splitByCategoryValues?: $TODO;
}

export interface HistogramRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: AggregationTypes;
  ticks?: $TODO;
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
export type HistogramResponse = $TODO;
