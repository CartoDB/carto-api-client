import React from 'react';
import {createComponent} from '@lit/react';
import {
  CategoryWidget as _CategoryWidget,
  FormulaWidget as _FormulaWidget,
  PieWidget as _PieWidget,
  ScatterWidget as _ScatterWidget,
  TableWidget as _TableWidget,
} from './index.js';

// TODO: React <=18 requires these wrappers to support Web Components. Because
// the wrappers depend on the `react` npm package, they belong in a separate
// package from the base Web Components, out of scope for POC.
// See: https://lit.dev/docs/frameworks/react/
//
// TODO: I'd intended to make these wrappers a subpath under `@carto/ui/react`,
// but am having trouble making that play well with Vite in local development,
// so the wrappers are here for now. See: https://github.com/vitejs/vite/discussions/17417

export const CategoryWidget = createComponent({
  tagName: 'category-widget',
  elementClass: _CategoryWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
    onfilter: 'filter',
  },
});

export const FormulaWidget = createComponent({
  tagName: 'formula-widget',
  elementClass: _FormulaWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});

export const PieWidget = createComponent({
  tagName: 'pie-widget',
  elementClass: _PieWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
    onfilter: 'filter',
  },
});

export const ScatterWidget = createComponent({
  tagName: 'scatter-widget',
  elementClass: _ScatterWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});

export const TableWidget = createComponent({
  tagName: 'table-widget',
  elementClass: _TableWidget,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});
