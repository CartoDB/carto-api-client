// core
export {MAP_TYPES, API_VERSIONS, AggregationTypes} from './vendor/carto-constants.js';
export type {Filter} from './vendor/deck-carto.js';

// data sources
export * from './sources.js';
export {TableDataView, QueryDataView} from './data-view.js';
export {FilterEvent} from './types.js';

// widgets
import {CategoryWidget} from './widgets/category-widget.js';
import {FormulaWidget} from './widgets/formula-widget.js';
import {PieWidget} from './widgets/pie-widget.js';
export type Widget = CategoryWidget | PieWidget | FormulaWidget;
export {CategoryWidget, FormulaWidget, PieWidget};
