import {Filter} from './vendor/deck-carto';

/******************************************************************************
 * COMMON
 */

export type $TODO = any;

/******************************************************************************
 * FILTERS
 */

export interface FilterEvent extends CustomEvent {
  detail: {filters: Record<string, Filter>};
}

/******************************************************************************
 * RESPONSES
 */

export type FormulaResponse = {value: number};
export type Category = {name: string; value: number};
export type CategoryResponse = Category[];
