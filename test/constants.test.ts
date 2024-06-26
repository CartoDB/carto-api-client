import {expect, test} from 'vitest';
import {GroupDateType, FilterType} from '@carto/api-client';

test('GroupDateType', () => {
  expect(GroupDateType.DAYS).toBe('day');
  expect(GroupDateType.HOURS).toBe('hour');
});

test('FilterType', () => {
  expect(FilterType.IN).toBe('in');
  expect(FilterType.STRING_SEARCH).toBe('stringSearch');
  expect(FilterType.CLOSED_OPEN).toBe('closed_open');
});
