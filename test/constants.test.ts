import {expect, test} from 'vitest';
import {CLIENT_ID, MAP_TYPES, API_VERSIONS} from '@carto/api-client';

test('constants', () => {
  expect(CLIENT_ID).toBe('carto-api-client');
  expect(MAP_TYPES.TABLE).toBe('table');
  expect(MAP_TYPES.QUERY).toBe('query');
  expect(MAP_TYPES.TILESET).toBe('tileset');
  expect(API_VERSIONS.V1).toBe('v1');
  expect(API_VERSIONS.V2).toBe('v2');
  expect(API_VERSIONS.V3).toBe('v3');
});
