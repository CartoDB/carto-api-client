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
  operation?: $TODO;
  operationExp?: $TODO;
}

export interface CategoryRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: $TODO;
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
  xAxisJoinOperation?: $TODO;
  yAxisColumn: string;
  yAxisJoinOperation?: $TODO;
}

export interface TimeSeriesRequestOptions extends BaseRequestOptions {
  column: string;
  stepSize?: $TODO;
  stepMultiplier?: $TODO;
  operation?: $TODO;
  operationColumn?: string;
  joinOperation?: $TODO;
  splitByCategory?: $TODO;
  splitByCategoryLimit?: $TODO;
  splitByCategoryValues?: $TODO;
}

export interface HistogramRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: $TODO;
  ticks?: $TODO;
}

/******************************************************************************
 * WIDGET API RESPONSES
 */

export type FormulaResponse = {value: number};
export type CategoryResponse = {name: string; value: number}[];
export type RangeResponse = $TODO;
export type TableResponse = $TODO;
export type ScatterResponse = $TODO;
export type TimeSeriesResponse = $TODO;
export type HistogramResponse = $TODO;
