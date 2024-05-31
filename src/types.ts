/******************************************************************************
 * COMMON
 */

export type $TODO = any;

/******************************************************************************
 * FILTERS
 */

export interface FilterEvent extends CustomEvent {
  detail: {filters: any};
}

/******************************************************************************
 * RESPONSES
 */

export type FormulaResponse = {value: number};
export type Category = {name: string; value: number};
export type CategoryResponse = Category[];
