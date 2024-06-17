import {CategoryWidget} from './category-widget.js';
import {FormulaWidget} from './formula-widget.js';
import {HistogramWidget} from './histogram-widget.js';
import {PieWidget} from './pie-widget.js';
import {ScatterWidget} from './scatter-widget.js';
import {TableWidget} from './table-widget.js';

export type Widget =
  | CategoryWidget
  | PieWidget
  | FormulaWidget
  | HistogramWidget
  | ScatterWidget
  | TableWidget;

export {
  CategoryWidget,
  FormulaWidget,
  HistogramWidget,
  PieWidget,
  ScatterWidget,
  TableWidget,
};

customElements.define('category-widget', CategoryWidget);
customElements.define('formula-widget', FormulaWidget);
customElements.define('histogram-widget', HistogramWidget);
customElements.define('pie-widget', PieWidget);
customElements.define('scatter-widget', ScatterWidget);
customElements.define('table-widget', TableWidget);

declare global {
  interface HTMLElementTagNameMap {
    'category-widget': CategoryWidget;
    'formula-widget': FormulaWidget;
    'histogram-widget': HistogramWidget;
    'pie-widget': PieWidget;
    'scatter-widget': ScatterWidget;
    'table-widget': TableWidget;
  }
}
