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

  describe('zoom-dependent point sizing (radiusScaleWithZoom)', () => {
    const ZOOM_SCALE_DATASET = {
      id: 'ZOOM_SCALE_DS',
      data: {
        tiles: ['https://example.com/tiles/{z}/{x}/{y}'],
        tilestats: {
          layers: [
            {
              attributes: [
                {attribute: 'revenue', min: 0, max: 1000, type: 'Number'},
              ],
            },
          ],
        },
      },
      type: 'tileset',
    };

    const buildLayerConfig = (
      visConfigOverrides: Record<string, any> = {},
      visualChannels: Record<string, any> = {}
    ) => ({
      version: 'v1',
      config: {
        mapState: {},
        mapStyle: {},
        visState: {
          layers: [
            {
              id: 'layer1',
              type: 'tileset',
              config: {
                dataId: 'ZOOM_SCALE_DS',
                label: 'Test Layer',
                textLabel: [{field: null, size: 12}],
                visConfig: {
                  filled: true,
                  opacity: 1,
                  colorRange: {
                    category: 'sequential',
                    colors: ['#f0f0f0', '#333333'],
                    colorMap: undefined,
                    name: 'custom',
                    type: 'custom',
                  },
                  radius: 5,
                  ...visConfigOverrides,
                },
              },
              visualChannels,
            },
          ],
          layerBlending: 'normal',
          interactionConfig: {tooltip: {enabled: false}},
        },
      },
    });

    test('radiusScaleWithZoom enabled emits common-unit scale for point and icon', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig({
          radiusScaleWithZoom: true,
          radiusReferenceZoom: 12,
        }),
      });
      const props = map.layers[0].props;
      const expectedScale = Math.pow(2, -12);
      expect(props.pointRadiusUnits).toBe('common');
      expect(props.pointRadiusScale).toBe(expectedScale);
      expect(props.iconSizeUnits).toBe('common');
      expect(props.iconSizeScale).toBe(expectedScale);
    });

    test('custom radiusReferenceZoom uses 2^-referenceZoom for the scale', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig({
          radiusScaleWithZoom: true,
          radiusReferenceZoom: 10,
        }),
      });
      const props = map.layers[0].props;
      const expectedScale = Math.pow(2, -10);
      expect(props.pointRadiusScale).toBe(expectedScale);
      expect(props.iconSizeScale).toBe(expectedScale);
    });

    test('sizeMinPixels and sizeMaxPixels are mirrored onto pointRadius and iconSize props', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig({
          radiusScaleWithZoom: true,
          radiusReferenceZoom: 12,
          sizeMinPixels: 4,
          sizeMaxPixels: 32,
        }),
      });
      const props = map.layers[0].props;
      expect(props.pointRadiusMinPixels).toBe(4);
      expect(props.pointRadiusMaxPixels).toBe(32);
      expect(props.iconSizeMinPixels).toBe(4);
      expect(props.iconSizeMaxPixels).toBe(32);
    });

    test('min/max pixel props are not set when sizeMinPixels/sizeMaxPixels are undefined', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig({
          radiusScaleWithZoom: true,
          radiusReferenceZoom: 12,
        }),
      });
      const props = map.layers[0].props;
      expect(props.pointRadiusMinPixels).toBeUndefined();
      expect(props.pointRadiusMaxPixels).toBeUndefined();
      expect(props.iconSizeMinPixels).toBeUndefined();
      expect(props.iconSizeMaxPixels).toBeUndefined();
    });

    test('radiusScaleWithZoom disabled leaves pointRadiusUnits at the pixel default', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig(),
      });
      const props = map.layers[0].props;
      expect(props.pointRadiusUnits).toBe('pixels');
      expect(props.pointRadiusScale).toBeUndefined();
      expect(props.iconSizeUnits).toBeUndefined();
      expect(props.iconSizeScale).toBeUndefined();
    });

    test('radiusField present disables zoom scaling (radius is data-driven)', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig(
          {radiusScaleWithZoom: true, radiusRange: [1, 20]},
          {
            radiusField: {name: 'revenue', type: 'real'},
            radiusScale: 'linear',
          }
        ),
      });
      const props = map.layers[0].props;
      expect(props.pointRadiusUnits).toBe('pixels');
      expect(props.pointRadiusScale).toBeUndefined();
    });

    test('sizeField present disables zoom scaling', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [ZOOM_SCALE_DATASET],
        keplerMapConfig: buildLayerConfig(
          {radiusScaleWithZoom: true, sizeRange: [1, 10]},
          {
            sizeField: {name: 'revenue', type: 'real'},
            sizeScale: 'linear',
          }
        ),
      });
      const props = map.layers[0].props;
      expect(props.pointRadiusUnits).toBe('pixels');
      expect(props.pointRadiusScale).toBeUndefined();
    });
  });

  describe('autoLabels for tileset textLabel', () => {
    const buildTilesetDataset = (geometry: string) => ({
      id: 'AUTOLABEL_DS',
      data: {
        tiles: ['https://example.com/tiles/{z}/{x}/{y}'],
        tilestats: {
          layers: [
            {
              attributes: [{attribute: 'name', categories: []}],
              geometry,
            },
          ],
        },
      },
      type: 'tileset',
    });

    const buildLayerConfig = (
      visConfigOverrides: Record<string, any> = {}
    ) => ({
      version: 'v1',
      config: {
        mapState: {},
        mapStyle: {},
        visState: {
          layers: [
            {
              id: 'layer1',
              type: 'tileset',
              config: {
                dataId: 'AUTOLABEL_DS',
                label: 'Test Layer',
                textLabel: [{field: {name: 'name', type: 'string'}, size: 12}],
                visConfig: {
                  filled: true,
                  opacity: 1,
                  colorRange: {
                    category: 'sequential',
                    colors: ['#f0f0f0', '#333333'],
                    colorMap: undefined,
                    name: 'custom',
                    type: 'custom',
                  },
                  radius: 5,
                  ...visConfigOverrides,
                },
              },
              visualChannels: {},
            },
          ],
          layerBlending: 'normal',
          interactionConfig: {tooltip: {enabled: false}},
        },
      },
    });

    test('Polygon tileset with uniqueIdField sets autoLabels with uniqueIdProperty and pointType=text', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [buildTilesetDataset('Polygon')],
        keplerMapConfig: buildLayerConfig({textLabelUniqueIdField: 'fid'}),
      });
      expect(map.layers[0].props.autoLabels).toEqual({uniqueIdProperty: 'fid'});
      expect(map.layers[0].props.pointType).toBe('text');
    });

    test.each([
      ['LineString'],
      ['MultiLineString'],
      ['Line'],
      ['MultiPolygon'],
    ])(
      '%s tileset without uniqueIdField sets autoLabels=true and pointType=text',
      (geometry) => {
        const map = parseMap({
          ...METADATA,
          datasets: [buildTilesetDataset(geometry)],
          keplerMapConfig: buildLayerConfig(),
        });
        expect(map.layers[0].props.autoLabels).toBe(true);
        expect(map.layers[0].props.pointType).toBe('text');
      }
    );

    test('Point tileset preserves circle+text pointType and does not set autoLabels', () => {
      const map = parseMap({
        ...METADATA,
        datasets: [buildTilesetDataset('Point')],
        keplerMapConfig: buildLayerConfig({textLabelUniqueIdField: 'fid'}),
      });
      expect(map.layers[0].props.autoLabels).toBeUndefined();
      expect(map.layers[0].props.pointType).toBe('circle+text');
    });

    test('Polygon tileset without a textLabel field does not set autoLabels', () => {
      const keplerMapConfig = buildLayerConfig();
      keplerMapConfig.config.visState.layers[0].config.textLabel = [
        {field: null, size: 12},
      ];
      const map = parseMap({
        ...METADATA,
        datasets: [buildTilesetDataset('Polygon')],
        keplerMapConfig,
      });
      expect(map.layers[0].props.autoLabels).toBeUndefined();
    });
  });

  describe('stroke dash style', () => {
    const buildDataset = (geometry: string) => ({
      id: 'STROKE_DS',
      data: {
        tiles: ['https://example.com/tiles/{z}/{x}/{y}'],
        tilestats: {
          layers: [
            {
              attributes: [
                {
                  attribute: 'road_type',
                  categories: [{category: 'a'}, {category: 'b'}],
                },
              ],
              geometry,
            },
          ],
        },
      },
      type: 'tileset',
    });

    const buildLayerConfig = (
      visConfigOverrides: Record<string, any> = {},
      visualChannels: Record<string, any> = {},
      type = 'tileset'
    ) => ({
      version: 'v1',
      config: {
        mapState: {},
        mapStyle: {},
        visState: {
          layers: [
            {
              id: 'layer1',
              type,
              config: {
                dataId: 'STROKE_DS',
                label: 'Test Layer',
                textLabel: [{field: null, size: 12}],
                visConfig: {
                  filled: true,
                  opacity: 1,
                  colorRange: {
                    category: 'sequential',
                    colors: ['#f0f0f0', '#333333'],
                    colorMap: undefined,
                    name: 'custom',
                    type: 'custom',
                  },
                  radius: 5,
                  ...visConfigOverrides,
                },
              },
              visualChannels,
            },
          ],
          layerBlending: 'normal',
          interactionConfig: {tooltip: {enabled: false}},
        },
      },
    });

    const parse = (
      geometry: string,
      ...args: Parameters<typeof buildLayerConfig>
    ) =>
      parseMap({
        ...METADATA,
        datasets: [buildDataset(geometry)],
        keplerMapConfig: buildLayerConfig(...args),
      }).layers[0];

    test('single-mode dashed line sets a constant getDashArray and the flat lineStyle/dashArray fields (no scale)', () => {
      const {props, scales} = parse('LineString', {
        lineStyle: 'dashed',
        dashArray: [4, 2],
      });
      expect(props.getDashArray).toEqual([4, 2]);
      expect(props.lineStyle).toBe('dashed');
      expect(props.dashArray).toEqual([4, 2]);
      expect(props.lineCapRounded).toBeUndefined();
      expect(scales.lineStyle).toBeUndefined();
    });

    test('dotted line sets lineCapRounded', () => {
      const {props} = parse('LineString', {
        lineStyle: 'dotted',
        dashArray: [0, 3],
      });
      expect(props.lineCapRounded).toBe(true);
      expect(props.getDashArray).toEqual([0, 3]);
    });

    test('solid line emits no dash props (deck.gl default renders solid)', () => {
      const {props} = parse('LineString', {lineStyle: 'solid'});
      expect(props.getDashArray).toBeUndefined();
      expect(props.lineStyle).toBeUndefined();
      expect(props.lineCapRounded).toBeUndefined();
    });

    test('polygon border needs stroked to receive dashes', () => {
      expect(
        parse('Polygon', {lineStyle: 'dashed', dashArray: [4, 2]}).props
          .getDashArray
      ).toBeUndefined();
      expect(
        parse('Polygon', {
          lineStyle: 'dashed',
          dashArray: [4, 2],
          stroked: true,
        }).props.getDashArray
      ).toEqual([4, 2]);
    });

    test('points never receive dashes even when stroked', () => {
      const {props} = parse('Point', {
        lineStyle: 'dashed',
        dashArray: [4, 2],
        stroked: true,
      });
      expect(props.getDashArray).toBeUndefined();
    });

    test('by-column mode builds a per-feature accessor and a lineStyle scale', () => {
      const {props, scales} = parse(
        'LineString',
        {
          lineStyle: 'dashed',
          dashArray: [4, 2],
          lineStyleRange: {
            dashArrayMap: [
              {value: 'a', dashArray: [4, 2]},
              {value: 'b', dashArray: [1, 1]},
            ],
            othersDashArray: [8, 8],
          },
        },
        {
          lineStyleField: {name: 'road_type', type: 'string'},
          lineStyleScale: 'ordinal',
        }
      );
      expect(typeof props.getDashArray).toBe('function');
      expect(props.getDashArray({properties: {road_type: 'a'}})).toEqual([
        4, 2,
      ]);
      expect(props.getDashArray({properties: {road_type: 'b'}})).toEqual([
        1, 1,
      ]);
      expect(props.getDashArray({properties: {road_type: 'z'}})).toEqual([
        8, 8,
      ]);
      expect(scales.lineStyle).toEqual({
        field: {name: 'road_type', type: 'string'},
        type: 'ordinal',
        domain: ['a', 'b'],
        range: [
          [4, 2],
          [1, 1],
        ],
      });
    });

    test('by-column mode renders even when the fixed lineStyle is solid (round caps for dotted values)', () => {
      const {props, scales} = parse(
        'LineString',
        {
          lineStyle: 'solid',
          lineStyleRange: {
            dashArrayMap: [
              {value: 'a', dashArray: [4, 2]},
              {value: 'b', dashArray: [0, 3]},
            ],
          },
        },
        {
          lineStyleField: {name: 'road_type', type: 'string'},
          lineStyleScale: 'ordinal',
        }
      );
      expect(typeof props.getDashArray).toBe('function');
      expect(props.getDashArray({properties: {road_type: 'b'}})).toEqual([
        0, 3,
      ]);
      expect(props.lineStyle).toBeUndefined(); // fixed preset stays solid → no flat prop
      expect(props.lineCapRounded).toBe(true); // a [0, gap] value ⇒ round dots
      expect(scales.lineStyle).toMatchObject({
        field: {name: 'road_type', type: 'string'},
        type: 'ordinal',
      });
    });

    test('non-vector-tile layer type receives no dashes', () => {
      const {props} = parse(
        'LineString',
        {lineStyle: 'dashed', dashArray: [4, 2]},
        {},
        'h3'
      );
      expect(props.getDashArray).toBeUndefined();
    });
  });

  describe('fill pattern', () => {
    const buildDataset = (geometry: string) => ({
      id: 'FILL_DS',
      data: {
        tiles: ['https://example.com/tiles/{z}/{x}/{y}'],
        tilestats: {
          layers: [
            {
              attributes: [
                {
                  attribute: 'zone',
                  categories: [{category: 'a'}, {category: 'b'}],
                },
              ],
              geometry,
            },
          ],
        },
      },
      type: 'tileset',
    });

    const buildLayerConfig = (
      visConfigOverrides: Record<string, any> = {},
      visualChannels: Record<string, any> = {},
      type = 'tileset'
    ) => ({
      version: 'v1',
      config: {
        mapState: {},
        mapStyle: {},
        visState: {
          layers: [
            {
              id: 'layer1',
              type,
              config: {
                dataId: 'FILL_DS',
                label: 'Test Layer',
                textLabel: [{field: null, size: 12}],
                visConfig: {
                  filled: true,
                  opacity: 1,
                  colorRange: {
                    category: 'sequential',
                    colors: ['#f0f0f0', '#333333'],
                    colorMap: undefined,
                    name: 'custom',
                    type: 'custom',
                  },
                  radius: 5,
                  ...visConfigOverrides,
                },
              },
              visualChannels,
            },
          ],
          layerBlending: 'normal',
          interactionConfig: {tooltip: {enabled: false}},
        },
      },
    });

    const parse = (
      geometry: string,
      ...args: Parameters<typeof buildLayerConfig>
    ) =>
      parseMap({
        ...METADATA,
        datasets: [buildDataset(geometry)],
        keplerMapConfig: buildLayerConfig(...args),
      }).layers[0];

    test('disabled: keeps atlas props stable and samples the solid cell', () => {
      const {props, scales} = parse('Polygon', {});
      expect(props.fillPatternEnabled).toBe(false);
      // Atlas props stay so the async prop never transitions to null on toggle
      // (that crashes deck's layer matching); solid cell renders as plain fill.
      expect(props.fillPatternAtlas).toBeInstanceOf(Promise);
      expect(props.getFillPattern()).toBe('solid');
      expect(props.fillPattern).toBeUndefined();
      expect(scales.fillPattern).toBeUndefined();
    });

    test('single mode: constant getFillPattern + atlas/mask props, no scale', () => {
      const {props, scales} = parse('Polygon', {
        fillPatternEnabled: true,
        fillPattern: 'hlines',
        fillPatternDensity: 'small',
        fillPatternSize: 2,
      });
      expect(props.fillPatternEnabled).toBe(true);
      expect(typeof props.getFillPattern).toBe('function');
      expect(props.getFillPattern()).toBe('hlines-small');
      expect(props.fillPatternAtlas).toBeInstanceOf(Promise);
      // Default 128 cell with an 8px wrapped-content gutter: pitch 144, col 2, row 0.
      expect(props.fillPatternMapping['hlines-small']).toMatchObject({
        x: 296,
        y: 8,
        width: 128,
        height: 128,
        mask: true,
      });
      expect(props.fillPatternMask).toBe(true);
      expect(props.getFillPatternScale).toBe(2);
      expect(props.fillPattern).toBe('hlines');
      expect(scales.fillPattern).toBeUndefined();
    });

    test('single mode defaults density to medium and scale to 1', () => {
      const {props} = parse('Polygon', {
        fillPatternEnabled: true,
        fillPattern: 'dots',
      });
      expect(props.getFillPattern()).toBe('dots-medium');
      expect(props.getFillPatternScale).toBe(1);
    });

    test('by-column mode builds a per-feature accessor and a fillPattern scale', () => {
      const {props, scales} = parse(
        'Polygon',
        {
          fillPatternEnabled: true,
          fillPattern: 'hlines',
          fillPatternDensity: 'medium',
          fillPatternRange: {
            patternMap: [
              {value: 'a', pattern: 'hlines'},
              {value: 'b', pattern: 'cross-hatch'},
            ],
            othersPattern: 'none',
          },
        },
        {
          fillPatternField: {name: 'zone', type: 'string'},
          fillPatternScale: 'ordinal',
        }
      );
      expect(typeof props.getFillPattern).toBe('function');
      expect(props.getFillPattern({properties: {zone: 'a'}})).toBe(
        'hlines-medium'
      );
      expect(props.getFillPattern({properties: {zone: 'b'}})).toBe(
        'cross-hatch-medium'
      );
      expect(props.getFillPattern({properties: {zone: 'z'}})).toBe('none');
      expect(scales.fillPattern).toEqual({
        field: {name: 'zone', type: 'string'},
        type: 'ordinal',
        domain: ['a', 'b'],
        range: ['hlines', 'cross-hatch'],
      });
    });

    test('applies to H3/Quadbin fills (not VectorTile-gated like strokes)', () => {
      const {props} = parse(
        'Polygon',
        {
          fillPatternEnabled: true,
          fillPattern: 'dots',
          fillPatternDensity: 'large',
        },
        {},
        'h3'
      );
      expect(props.fillPatternEnabled).toBe(true);
      expect(props.getFillPattern()).toBe('dots-large');
    });

    test('unfilled layer emits no pattern props and reports the flag off', () => {
      const {props} = parse('Polygon', {
        filled: false,
        fillPatternEnabled: true,
        fillPattern: 'hlines',
      });
      expect(props.fillPatternEnabled).toBe(false);
      expect(props.getFillPattern).toBeUndefined();
      expect(props.fillPatternAtlas).toBeUndefined();
    });
  });
});
