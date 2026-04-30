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

  // Mock input with popupSettings and legendSettings
  const mockInput = {
    id: 'test-map',
    title: 'Test Map',
    keplerMapConfig: {
      version: 'v1',
      config: {
        mapState: {},
        mapStyle: {},
        legendSettings: {
          layers: {
            abcd1234: {
              active: true,
              entries: [],
              shouldDisplayEntries: true,
            },
            wxyz5678: {
              active: true,
              entries: [
                {
                  hash: '041fefde86682c870543f0be4637fc81',
                  visualChannel: 'color',
                  customColorLabels: ['Meteorites'],
                },
              ],
              shouldDisplayEntries: true,
            },
          },
          expanded: {
            '0': true,
            '1': false,
          },
          baseMapSelector: false,
        },
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
  test('popupSettings and legendSettings are exported', () => {
    const result = parseMap(mockInput);
    const config = mockInput.keplerMapConfig.config;

    expect(result.popupSettings).toBeDefined();
    expect(result.popupSettings).toEqual(config.popupSettings);

    expect(result.legendSettings).toBeDefined();
    expect(result.legendSettings).toEqual(config.legendSettings);
  });

  describe('custom aggregation', () => {
    const CUSTOM_AGG_DATASET = {
      id: 'CUSTOM_AGG_DS',
      data: {
        scheme: 'h3',
        tiles: ['https://example.com/tiles/{i}'],
        tilestats: {
          layers: [
            {
              attributes: [
                {
                  attribute: 'custom_agg_cc6f64ff',
                  min: 0,
                  max: 100,
                  type: 'Number',
                },
                {attribute: 'revenue', min: 0, max: 1000, type: 'Number'},
                {attribute: 'revenue_sum', min: 0, max: 5000, type: 'Number'},
              ],
            },
          ],
        },
        accessToken: 'test-token',
      },
      type: 'tileset',
      providerId: 'bigquery',
      connectionName: 'test',
      geoColumn: 'geom',
      columns: [],
      format: 'tilejson',
      aggregationExp: '1 AS __aggregationValue',
      aggregationResLevel: 4,
      queryParameters: [],
    };

    test('custom color aggregation sets accessorKey on colorField', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    colorAggregation: 'custom',
                    colorAggregationExp: 'SUM(x)/SUM(y)',
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    sizeAggregation: 'sum',
                    sizeRange: [1, 10],
                    radius: 5,
                  },
                },
                visualChannels: {
                  colorField: {name: 'revenue', type: 'real'},
                  colorScale: 'quantize',
                  sizeField: {name: 'revenue', type: 'real'},
                  sizeScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.fillColor?.field?.accessorKey).toBe(
        'custom_agg_cc6f64ff'
      );
    });

    test('standard aggregation does not set accessorKey', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    colorAggregation: 'sum',
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    sizeAggregation: 'sum',
                    sizeRange: [1, 10],
                    radius: 5,
                  },
                },
                visualChannels: {
                  colorField: {name: 'revenue', type: 'real'},
                  colorScale: 'quantize',
                  sizeField: {name: 'revenue', type: 'real'},
                  sizeScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(
        map.layers[0].scales.fillColor?.field?.accessorKey
      ).toBeUndefined();
    });

    test('mixed custom color and standard size: color gets accessorKey, size does not', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    colorAggregation: 'custom',
                    colorAggregationExp: 'SUM(x)/SUM(y)',
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    sizeAggregation: 'sum',
                    sizeRange: [1, 10],
                    radius: 5,
                  },
                },
                visualChannels: {
                  colorField: {name: 'revenue', type: 'real'},
                  colorScale: 'quantize',
                  sizeField: {name: 'revenue', type: 'real'},
                  sizeScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      const layerDesc = map.layers[0];
      expect(layerDesc.scales.fillColor?.field?.accessorKey).toBe(
        'custom_agg_cc6f64ff'
      );
      expect(layerDesc.scales.lineWidth).toBeDefined();
      expect(layerDesc.scales.lineWidth?.field?.accessorKey).toBeUndefined();
    });

    test('colorAggregationDomain overrides auto-computed scale domain', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    colorAggregation: 'custom',
                    colorAggregationExp: 'SUM(x)/SUM(y)',
                    colorAggregationDomain: [10, 90],
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    sizeAggregation: 'sum',
                    sizeRange: [1, 10],
                    radius: 5,
                  },
                },
                visualChannels: {
                  colorField: {name: 'revenue', type: 'real'},
                  colorScale: 'quantize',
                  sizeField: {name: 'revenue', type: 'real'},
                  sizeScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.fillColor?.scaleDomain).toEqual([10, 90]);
    });

    test.each([
      {title: 'whitespace-only expression', expression: '   '},
      {title: 'empty expression', expression: ''},
    ])(
      'custom color aggregation with $title does not set accessorKey',
      ({expression}) => {
        const keplerMapConfig = {
          version: 'v1',
          config: {
            mapState: {},
            mapStyle: {},
            visState: {
              layers: [
                {
                  id: 'layer1',
                  type: 'h3',
                  config: {
                    dataId: 'CUSTOM_AGG_DS',
                    label: 'Test Layer',
                    textLabel: [{field: null, size: 12}],
                    visConfig: {
                      filled: true,
                      opacity: 1,
                      colorAggregation: 'custom',
                      colorAggregationExp: expression,
                      colorRange: {
                        category: 'sequential',
                        colors: ['#f0f0f0', '#333333'],
                        colorMap: undefined,
                        name: 'custom',
                        type: 'custom',
                      },
                      sizeAggregation: 'sum',
                      sizeRange: [1, 10],
                      radius: 5,
                    },
                  },
                  visualChannels: {
                    colorField: {name: 'revenue', type: 'real'},
                    colorScale: 'quantize',
                    sizeField: {name: 'revenue', type: 'real'},
                    sizeScale: 'linear',
                  },
                },
              ],
              layerBlending: 'normal',
              interactionConfig: {tooltip: {enabled: false}},
            },
          },
        };
        const map = parseMap({
          ...METADATA,
          datasets: [CUSTOM_AGG_DATASET],
          keplerMapConfig,
        });
        expect(
          map.layers[0].scales.fillColor?.field?.accessorKey
        ).toBeUndefined();
      }
    );

    test('colorRange.colorMap break values win over colorAggregationDomain', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    colorAggregation: 'custom',
                    colorAggregationExp: 'SUM(x)/SUM(y)',
                    colorAggregationDomain: [10, 90],
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: [
                        [25, '#f0f0f0'],
                        [75, '#333333'],
                      ],
                      name: 'custom',
                      type: 'custom',
                    },
                    sizeAggregation: 'sum',
                    sizeRange: [1, 10],
                    radius: 5,
                  },
                },
                visualChannels: {
                  colorField: {name: 'revenue', type: 'real'},
                  colorScale: 'quantize',
                  sizeField: {name: 'revenue', type: 'real'},
                  sizeScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.fillColor?.scaleDomain).toEqual([25, 75]);
    });

    test('radiusAggregationDomain applies to point radius channel', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    radiusAggregation: 'custom',
                    radiusAggregationExp: 'SUM(x)/SUM(y)',
                    radiusAggregationDomain: [5, 50],
                    radiusRange: [1, 20],
                    radius: 5,
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                  },
                },
                visualChannels: {
                  radiusField: {name: 'revenue', type: 'real'},
                  radiusScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.pointRadius?.domain).toEqual([5, 50]);
    });

    test('custom strokeColor aggregation sets accessorKey on strokeColor scale', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    stroked: true,
                    opacity: 1,
                    strokeColorAggregation: 'custom',
                    strokeColorAggregationExp: 'SUM(x)/SUM(y)',
                    strokeColorAggregationDomain: [10, 90],
                    strokeColorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    radius: 5,
                  },
                },
                visualChannels: {
                  strokeColorField: {name: 'revenue', type: 'real'},
                  strokeColorScale: 'quantize',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.lineColor?.field?.accessorKey).toBe(
        'custom_agg_cc6f64ff'
      );
      expect(map.layers[0].scales.lineColor?.scaleDomain).toEqual([10, 90]);
    });

    test('custom size aggregation sets accessorKey on lineWidth scale', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    stroked: true,
                    opacity: 1,
                    sizeAggregation: 'custom',
                    sizeAggregationExp: 'SUM(x)/SUM(y)',
                    sizeAggregationDomain: [2, 8],
                    sizeRange: [1, 10],
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    radius: 5,
                  },
                },
                visualChannels: {
                  sizeField: {name: 'revenue', type: 'real'},
                  sizeScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.lineWidth?.field?.accessorKey).toBe(
        'custom_agg_cc6f64ff'
      );
      expect(map.layers[0].scales.lineWidth?.domain).toEqual([2, 8]);
    });

    test('custom height aggregation sets accessorKey on elevation scale', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    enable3d: true,
                    heightAggregation: 'custom',
                    heightAggregationExp: 'SUM(x)/SUM(y)',
                    heightAggregationDomain: [100, 500],
                    heightRange: [0, 1000],
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    radius: 5,
                  },
                },
                visualChannels: {
                  heightField: {name: 'revenue', type: 'real'},
                  heightScale: 'linear',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.elevation?.field?.accessorKey).toBe(
        'custom_agg_cc6f64ff'
      );
      expect(map.layers[0].scales.elevation?.domain).toEqual([100, 500]);
    });

    test('custom weight aggregation sets accessorKey on weight scale', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    weightAggregation: 'custom',
                    weightAggregationExp: 'SUM(x)/SUM(y)',
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    radius: 5,
                  },
                },
                visualChannels: {
                  weightField: {name: 'revenue', type: 'real'},
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      expect(map.layers[0].scales.weight?.field?.accessorKey).toBe(
        'custom_agg_cc6f64ff'
      );
    });

    test('accessorKey wins over colorColumn and preserves the caller scale type', () => {
      const keplerMapConfig = {
        version: 'v1',
        config: {
          mapState: {},
          mapStyle: {},
          visState: {
            layers: [
              {
                id: 'layer1',
                type: 'h3',
                config: {
                  dataId: 'CUSTOM_AGG_DS',
                  label: 'Test Layer',
                  textLabel: [{field: null, size: 12}],
                  visConfig: {
                    filled: true,
                    opacity: 1,
                    colorAggregation: 'custom',
                    colorAggregationExp: 'SUM(x)/SUM(y)',
                    colorRange: {
                      category: 'sequential',
                      colors: ['#f0f0f0', '#333333'],
                      colorMap: undefined,
                      name: 'custom',
                      type: 'custom',
                    },
                    radius: 5,
                  },
                },
                visualChannels: {
                  colorField: {
                    name: 'revenue',
                    type: 'real',
                    colorColumn: 'revenue',
                  },
                  colorScale: 'quantize',
                },
              },
            ],
            layerBlending: 'normal',
            interactionConfig: {tooltip: {enabled: false}},
          },
        },
      };
      const map = parseMap({
        ...METADATA,
        datasets: [CUSTOM_AGG_DATASET],
        keplerMapConfig,
      });
      const fillColor = map.layers[0].scales.fillColor;
      expect(fillColor?.field?.accessorKey).toBe('custom_agg_cc6f64ff');
      expect(fillColor?.scaleDomain).toEqual([0, 100]);
    });
  });
});
