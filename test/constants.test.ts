import {expect, test} from 'vitest';
import {CLIENT_ID, MapType, ApiVersion} from '@carto/api-client';

test('constants', () => {
  expect(CLIENT_ID).toBe('carto-api-client');
  expect(MapType.TABLE).toBe('table');
  expect(MapType.QUERY).toBe('query');
  expect(MapType.TILESET).toBe('tileset');
  expect(ApiVersion.V1).toBe('v1');
  expect(ApiVersion.V2).toBe('v2');
  expect(ApiVersion.V3).toBe('v3');
});
