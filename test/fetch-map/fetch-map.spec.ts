import {describe, test, expect} from 'vitest';
import {fetchMap} from '@carto/api-client';

describe('fetchMap', () => {
  test('exports', () => {
    expect(fetchMap).toBeDefined();
  });
});
