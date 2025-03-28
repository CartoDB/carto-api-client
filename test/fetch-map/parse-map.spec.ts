import {describe, test, expect, vi} from 'vitest';
import {parseMap} from '@carto/api-client';

const METADATA = {
  id: 1234,
  title: 'Title',
  description: 'Description',
  createdAt: 'createdAt timestamp',
  updatedAt: 'updatedAt timestamp',
  token: 'API_TOKEN',
};

const EMPTY_KEPLER_MAP_CONFIG = {
  version: 'v1',
  config: {
    mapState: 'INITIAL_VIEW_STATE',
    mapStyle: 'MAP_STYLE',
    visState: {
      layers: [],
    },
  },
};

const tilestats = {
  layers: [
    {
      attributes: [
        {
          attribute: 'STRING_ATTR',
          categories: [{category: '1'}, {category: '2'}, {category: '3'}],
        },
        {
          attribute: 'NUMBER_ATTR',
          min: 0,
          max: 10,
        },
      ],
    },
  ],
};

const DATASETS = [
  {
    id: 'DATA_TILESET_ID',
    data: {
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{z}/{x}/{y}?name=my_data&formatTiles=mvt`,
      ],
      tilestats,
    },
    type: 'tileset',
  },
  {
    id: 'DATA_TILESET_H3_ID',
    data: {
      scheme: 'h3',
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{i}?name=my_data&formatTiles=json&spatialIndex=h3`,
      ],
      tilestats,
    },
    type: 'tileset',
  },
  {
    id: 'DATA_TILESET_QUADBIN_ID',
    data: {
      scheme: 'quadbin',
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{i}?name=my_data&formatTiles=json&spatialIndex=quadbin`,
      ],
      tilestats,
    },
    type: 'tileset',
  },
];

describe('parseMap', () => {
  test('empty map config', () => {
    const map = parseMap({
      ...METADATA,
      datasets: DATASETS,
      keplerMapConfig: EMPTY_KEPLER_MAP_CONFIG,
    });
    expect(map.layers).toEqual([]);
  });

  test('unsupported layer type', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'unsupported1',
              type: 'unsupported',
              config: {
                dataId: 'DATA_ID',
                label: 'Unsupported Layer',
                isVisible: true,
              },
            },
          ],
        },
      },
    };

    const mockConsoleError = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined);

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    expect(map.layers).toEqual([undefined]);

    expect(mockConsoleError).toHaveBeenCalledWith(
      'No dataset matching dataId: DATA_ID'
    );
  });

  test('missing dataset', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'layer1',
              type: 'geojson',
              config: {
                dataId: 'MISSING_DATA_ID',
                label: 'Missing Data Layer',
                isVisible: true,
              },
            },
          ],
        },
      },
    };

    const mockConsoleError = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined);

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    expect(map.layers).toEqual([undefined]);

    expect(mockConsoleError).toHaveBeenCalledWith(
      'No dataset matching dataId: MISSING_DATA_ID'
    );
  });

  test('popupSettings are exported', () => {
    // Mock input with popupSettings
    const mockInput = {
      id: 'test-map',
      title: 'Test Map',
      keplerMapConfig: {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          popupSettings: {
            enabled: true,
            fields: ['field1', 'field2'],
          },
          visState: {
            layers: [],
            layerBlending: 'normal',
            interactionConfig: {},
          },
        },
      },
      datasets: [],
      token: 'test-token',
    };

    const result = parseMap(mockInput);

    expect(result.popupSettings).toBeDefined();
    expect(result.popupSettings).toEqual({
      enabled: true,
      fields: ['field1', 'field2'],
    });
  });
});
