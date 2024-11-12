import {expect, test} from 'vitest';
import {FilterType, DEFAULT_API_BASE_URL} from '@carto/api-client';

test('FilterType', () => {
  expect(FilterType.IN).toBe('in');
  expect(FilterType.STRING_SEARCH).toBe('stringSearch');
  expect(FilterType.CLOSED_OPEN).toBe('closed_open');
});

test('DEFAULT_API_BASE_URL', () => {
  expect(DEFAULT_API_BASE_URL).toMatch(/^https:\/\//);
});
