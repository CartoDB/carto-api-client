import React from 'react';
import {createComponent} from '@lit/react';
import {
  CategoryWidget as _CategoryWidget,
  FormulaWidget as _FormulaWidget,
  HistogramWidget as _HistogramWidget,
  PieWidget as _PieWidget,
  ScatterWidget as _ScatterWidget,
  TableWidget as _TableWidget,
} from './index.js';

// React <=18 requires these wrappers to support Web Components.
// See: https://lit.dev/docs/frameworks/react/

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

export const HistogramWidget = createComponent({
  tagName: 'histogram-widget',
  elementClass: _HistogramWidget,
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
