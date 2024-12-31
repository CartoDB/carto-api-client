import {describe, test, expect} from 'vitest';
import {makeIntervalComplete} from '@carto/api-client';

describe('make interval complete', () => {
  test('first value is undefined', () => {
    const DATA = [[undefined, 1]] as any;
    expect(makeIntervalComplete(DATA)).toEqual([[Number.MIN_SAFE_INTEGER, 1]]);
  });

  test('first value is null', () => {
    const DATA = [[null, 1]] as any;
    expect(makeIntervalComplete(DATA)).toEqual([[Number.MIN_SAFE_INTEGER, 1]]);
  });

  test('last value is undefined', () => {
    const DATA = [[1, undefined]] as any;
    expect(makeIntervalComplete(DATA)).toEqual([[1, Number.MAX_SAFE_INTEGER]]);
  });

  test('last value is null', () => {
    const DATA = [[1, null]] as any;
    expect(makeIntervalComplete(DATA)).toEqual([[1, Number.MAX_SAFE_INTEGER]]);
  });

  test('both values are not undefined or null', () => {
    const DATA = [[1, 1]] as any;
    expect(makeIntervalComplete(DATA)).toEqual([[1, 1]]);
  });
});
