import {CategoryWidget} from './category-widget.js';
import {FormulaWidget} from './formula-widget.js';
import {PieWidget} from './pie-widget.js';
import {ScatterWidget} from './scatter-widget.js';
import {TableWidget} from './table-widget.js';

export type Widget =
  | CategoryWidget
  | PieWidget
  | FormulaWidget
  | ScatterWidget
  | TableWidget;

export {CategoryWidget, FormulaWidget, PieWidget, ScatterWidget, TableWidget};

declare global {
  interface HTMLElementTagNameMap {
    'category-widget': CategoryWidget;
    'formula-widget': FormulaWidget;
    'pie-widget': PieWidget;
    'scatter-widget': ScatterWidget;
    'table-widget': TableWidget;
  }
}
