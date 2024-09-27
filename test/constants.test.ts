import {expect, test} from 'vitest';
import {FilterType} from '@carto/api-client';

test('FilterType', () => {
  expect(FilterType.IN).toBe('in');
  expect(FilterType.STRING_SEARCH).toBe('stringSearch');
  expect(FilterType.CLOSED_OPEN).toBe('closed_open');
});
