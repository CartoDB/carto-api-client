import {expect, test} from 'vitest';
import {
  GroupDateType,
  FilterType,
  clearFilters,
  addFilter,
  removeFilter,
  getFilter,
  hasFilter,
} from '@carto/api-client';

test('addFilter', () => {
  let filters = {};

  filters = addFilter(filters, {
    column: 'column_a',
    type: FilterType.IN,
    values: [1, 2],
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
  });

  filters = addFilter(filters, {
    column: 'column_b',
    type: FilterType.IN,
    values: [3, 4],
    owner: 'my-widget',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.IN]: {values: [3, 4], owner: 'my-widget'},
    },
  });

  filters = addFilter(filters, {
    column: 'column_b',
    type: FilterType.BETWEEN,
    values: [[3, 4]],
    owner: 'my-widget-2',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.IN]: {values: [3, 4], owner: 'my-widget'},
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'my-widget-2'},
    },
  });

  filters = addFilter(filters, {
    column: 'column_b',
    type: FilterType.IN,
    values: ['a', 'b'],
    owner: 'my-widget-3',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.IN]: {values: ['a', 'b'], owner: 'my-widget-3'},
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'my-widget-2'},
    },
  });
});

test('removeFilter', () => {
  let filters = {};

  filters = removeFilter(filters, {
    column: 'no-such-column',
    owner: 'my-widget',
  });

  expect(filters).toMatchObject({});

  filters = {
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.IN]: {values: ['a', 'b'], owner: 'my-widget-3'},
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'my-widget-2'},
    },
  };

  filters = removeFilter(filters, {
    column: 'column_b',
    owner: 'my-widget-3',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'my-widget-2'},
    },
  });

  filters = removeFilter(filters, {
    column: 'column_b',
    owner: 'no-such-owner',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'my-widget-2'},
    },
  });

  filters = removeFilter(filters, {
    column: 'column_b',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
  });

  filters = removeFilter(filters, {
    column: 'no-such-column',
  });

  expect(filters).toMatchObject({
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
  });
});

test('clearFilters', () => {
  let filters = clearFilters({});

  expect(filters).toMatchObject({});

  filters = clearFilters({
    column_a: {[FilterType.IN]: {values: [1, 2]}},
    column_b: {
      [FilterType.IN]: {values: [3, 4]},
      [FilterType.BETWEEN]: {values: [[0, 1]]},
    },
  });

  expect(filters).toMatchObject({});
});

test('getFilter', () => {
  const filters = {
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.IN]: {values: ['a', 'b'], owner: 'my-widget-3'},
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'my-widget-2'},
    },
  };

  expect(
    getFilter(filters, {column: 'no-such-column', type: FilterType.IN})
  ).toBeNull();

  expect(
    getFilter(filters, {column: 'column_a', type: FilterType.IN})
  ).toMatchObject({values: [1, 2]});
  expect(
    getFilter(filters, {column: 'column_a', type: FilterType.IN, owner: 'none'})
  ).toBeNull();

  expect(
    getFilter(filters, {
      column: 'column_b',
      type: FilterType.IN,
      owner: 'my-widget-3',
    })
  ).toMatchObject({values: ['a', 'b'], owner: 'my-widget-3'});
  expect(
    getFilter(filters, {
      column: 'column_b',
      type: FilterType.BETWEEN,
      owner: 'my-widget-3',
    })
  ).toBeNull();
  expect(
    getFilter(filters, {
      column: 'column_b',
      type: FilterType.BETWEEN,
      owner: 'my-widget-2',
    })
  ).toMatchObject({values: [[3, 4]], owner: 'my-widget-2'});
});

test('hasFilter', () => {
  const filters = {
    column_a: {
      [FilterType.IN]: {values: [1, 2]},
    },
    column_b: {
      [FilterType.IN]: {values: ['a', 'b'], owner: 'owner-3'},
      [FilterType.BETWEEN]: {values: [[3, 4]], owner: 'owner-2'},
    },
  };

  expect(hasFilter(filters, {column: 'no-such-column'})).toBe(false);
  expect(hasFilter(filters, {column: 'no-such-column', owner: 'owner-4'})).toBe(
    false
  );

  expect(hasFilter(filters, {column: 'column_a'})).toBe(true);
  expect(hasFilter(filters, {column: 'column_a', owner: ''})).toBe(true);
  expect(hasFilter(filters, {column: 'column_a', owner: null})).toBe(true);
  expect(hasFilter(filters, {column: 'column_a', owner: undefined})).toBe(true);
  expect(hasFilter(filters, {column: 'column_a', owner: 'owner-4'})).toBe(
    false
  );

  expect(hasFilter(filters, {column: 'column_b', owner: 'owner-3'})).toBe(true);
  expect(hasFilter(filters, {column: 'column_b', owner: 'owner-2'})).toBe(true);
});
