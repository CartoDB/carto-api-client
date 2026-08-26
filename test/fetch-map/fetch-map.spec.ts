import {describe, test, expect} from 'vitest';
import {fetchMap, _fillInMapDatasets} from '@carto/api-client';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

const CONTEXT = {
  accessToken: '<token>',
  apiBaseUrl: 'https://api.carto.com',
} as any;

// Shape a map has before Builder has ever saved it: no `filters`, and none of
// the other keys Builder adds on its first save.
const UNSAVED_MAP_CONFIG = {
  version: 'v1',
  config: {
    mapState: {latitude: 0, longitude: 0, zoom: 5, pitch: 0, bearing: 0},
    mapStyle: {styleType: 'positron', visibleLayerGroups: {}},
    visState: {layers: []},
  },
} as any;

const DATASET = {
  id: '2f741aa8-6ef8-49bd-ab99-c40f35547da8',
  type: 'tileset',
  source: 'carto-demo-data.demo_tilesets.osm_buildings',
  connectionName: 'carto_dw',
  geoColumn: 'geom',
} as any;

describe('fetchMap', () => {
  test('exports', () => {
    expect(fetchMap).toBeDefined();
  });
});

describe('fillInMapDatasets', () => {
  test('map config without filters', async () => {
    stubGlobalFetchForSource();
    const datasets = [{...DATASET}];

    await expect(
      _fillInMapDatasets(
        {datasets, keplerMapConfig: UNSAVED_MAP_CONFIG},
        CONTEXT
      )
    ).resolves.toEqual([true]);

    expect(datasets[0].data).toMatchObject({tiles: expect.any(Array)});
  });
});
