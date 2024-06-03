import React from 'react';
import {createComponent} from '@lit/react';
import {
  CategoryWidget,
  FormulaWidget,
  PieWidget,
  TableWidget,
} from './widgets/index.js';

// TODO: React <=18 requires these wrappers to support Web Components. Because
// the wrappers depend on the `react` npm package, they belong in a separate
// package from the base Web Components, out of scope for POC.
// See: https://lit.dev/docs/frameworks/react/

export const FormulaWidgetComponent = createComponent({
  tagName: 'formula-widget',
  elementClass: FormulaWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});

export const PieWidgetComponent = createComponent({
  tagName: 'pie-widget',
  elementClass: PieWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
    onfilter: 'filter',
  },
});

export const CategoryWidgetComponent = createComponent({
  tagName: 'category-widget',
  elementClass: CategoryWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
    onfilter: 'filter',
  },
});

export const TableWidgetComponent = createComponent({
  tagName: 'table-widget',
  elementClass: TableWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});
