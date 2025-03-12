// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, test, expect} from 'vitest';
import {fetchMap} from '@deck.gl/carto';
import {withMockFetchMapsV3} from '../mock-fetch';

describe('fetchMap', () => {
  test('exports', () => {
    expect(fetchMap).toBeDefined();
  });

  test('basic functionality', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async _calls => {
      calls = _calls;
      const response = await fetchMap('map_id');
      
      expect(calls.length).toBe(1);
      expect(calls[0].url).toBe('https://gcp-us-east1.api.carto.com/v3/maps/map_id');
      expect(calls[0].method).toBe('GET');
      expect(response).toBeDefined();
    });
  });

  test('error handling', async () => {
    await withMockFetchMapsV3(async () => {
      const error = await fetchMap('invalid_id').catch(e => e);
      expect(error.message).toBe('Map not found');
    }, async () => {
      throw new Error('Map not found');
    });
  });

  test('custom options', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async _calls => {
      calls = _calls;
      const options = {
        baseURL: 'https://custom.carto.com',
        headers: {'Custom-Header': 'value'}
      };
      
      await fetchMap('map_id', options);
      
      expect(calls.length).toBe(1);
      expect(calls[0].url).toBe('https://custom.carto.com/v3/maps/map_id');
      expect(calls[0].headers['Custom-Header']).toBe('value');
    });
  });
});
