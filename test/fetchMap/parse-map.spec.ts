// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, test, expect} from 'vitest';
import {parseMap} from '@carto/api-client';
import {GeoJsonLayer} from '@deck.gl/layers';
import {H3TileLayer, QuadbinTileLayer, VectorTileLayer, HeatmapTileLayer} from '@deck.gl/carto';
import {H3HexagonLayer} from '@deck.gl/geo-layers';
import {GridLayer, HeatmapLayer, HexagonLayer} from '@deck.gl/aggregation-layers';

const METADATA = {
  id: 1234,
  title: 'Title',
  description: 'Description',
  createdAt: 'createdAt timestamp',
  updatedAt: 'updatedAt timestamp',
  token: 'API_TOKEN'
};

const EMPTY_KEPLER_MAP_CONFIG = {
  version: 'v1',
  config: {
    mapState: 'INITIAL_VIEW_STATE',
    mapStyle: 'MAP_STYLE',
    visState: {
      layers: []
    }
  }
};

const tilestats = {
  layers: [
    {
      attributes: [
        {
          attribute: 'STRING_ATTR',
          categories: [{category: '1'}, {category: '2'}, {category: '3'}]
        },
        {
          attribute: 'NUMBER_ATTR',
          min: 0,
          max: 10
        }
      ]
    }
  ]
};

const DATASETS = [
  {
    id: 'DATA_ID',
    data: {type: 'FeatureCollection', features: []}
  },
  {
    id: 'DATA_JSON_ID',
    data: []
  },
  {
    id: 'DATA_TILESET_ID',
    data: {
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{z}/{x}/{y}?name=my_data&formatTiles=mvt`
      ],
      tilestats
    },
    type: 'tileset'
  },
  {
    id: 'DATA_TILESET_GEOJSON_FORMAT_ID',
    data: {
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{z}/{x}/{y}?name=my_data&formatTiles=geojson`
      ],
      tilestats
    },
    type: 'tileset'
  },
  {
    id: 'DATA_TILESET_BINARY_FORMAT_ID',
    data: {
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{z}/{x}/{y}?name=my_data&formatTiles=binary`
      ],
      tilestats
    },
    type: 'tileset'
  },
  {
    id: 'DATA_TILESET_H3_ID',
    data: {
      scheme: 'h3',
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{i}?name=my_data&formatTiles=json&spatialIndex=h3`
      ],
      tilestats
    },
    type: 'tileset'
  },
  {
    id: 'DATA_TILESET_QUADBIN_ID',
    data: {
      scheme: 'quadbin',
      tiles: [
        `https://gcp-us-east1.api.carto.com/v3/maps/my_connection/tileset/{i}?name=my_data&formatTiles=json&spatialIndex=quadbin`
      ],
      tilestats
    },
    type: 'tileset'
  }
];

describe('parseMap', () => {
  test('empty map config', () => {
    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig: EMPTY_KEPLER_MAP_CONFIG});
    expect(map.layers).toEqual([]);
  });

  test('geojson layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'vlu4f7d',
              type: 'geojson',
              config: {
                dataId: 'DATA_ID',
                label: 'Stores',
                color: [18, 147, 154],
                columns: {
                  geojson: '_geojson'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  strokeOpacity: 0.8,
                  thickness: 0.5,
                  strokeColor: [218, 112, 191],
                  colorRange: {
                    name: 'Global Warming',
                    type: 'sequential',
                    category: 'Uber',
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  strokeColorRange: {
                    name: 'Global Warming',
                    type: 'sequential',
                    category: 'Uber',
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  radius: 10
                }
              },
              visualChannels: {
                colorField: {
                  name: 'store_id',
                  type: 'integer'
                },
                colorScale: 'quantile',
                strokeColorField: null,
                strokeColorScale: 'quantile'
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`GeoJsonLayer({id: 'vlu4f7d'})`]);
    
    const geoJsonLayer = map.layers[0] as GeoJsonLayer;
    expect(geoJsonLayer.props.id).toBe('vlu4f7d');
    expect(geoJsonLayer.props.pickable).toBe(true);
    expect(geoJsonLayer.props.stroked).toBe(true);
    expect(geoJsonLayer.props.filled).toBe(true);
    expect(geoJsonLayer.props.lineWidthScale).toBe(0.5);
    expect(geoJsonLayer.props.lineWidthMinPixels).toBe(1);
    expect(geoJsonLayer.props.getLineColor).toEqual([218, 112, 191, 204]);
    expect(geoJsonLayer.props.getFillColor).toBeDefined();
    expect(geoJsonLayer.props.getRadius).toBe(10);
    expect(geoJsonLayer.props.opacity).toBe(0.8);
  });

  test('vector tile layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'vlu4f7d',
              type: 'geojson',
              config: {
                dataId: 'DATA_TILESET_ID',
                label: 'Stores',
                color: [18, 147, 154],
                columns: {
                  geojson: '_geojson'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  strokeOpacity: 0.8,
                  thickness: 0.5,
                  strokeColor: [218, 112, 191],
                  colorRange: {
                    name: 'Global Warming',
                    type: 'sequential',
                    category: 'Uber',
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  strokeColorRange: {
                    name: 'Global Warming',
                    type: 'sequential',
                    category: 'Uber',
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  radius: 10
                }
              },
              visualChannels: {
                colorField: {
                  name: 'store_id',
                  type: 'integer'
                },
                colorScale: 'quantile',
                strokeColorField: null,
                strokeColorScale: 'quantile'
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`VectorTileLayer({id: 'vlu4f7d'})`]);
    
    const vectorTileLayer = map.layers[0] as VectorTileLayer;
    expect(vectorTileLayer.props.id).toBe('vlu4f7d');
    expect(vectorTileLayer.props.data).toBe(DATASETS[2].data);
    expect(vectorTileLayer.props.pickable).toBe(true);
    expect(vectorTileLayer.props.stroked).toBe(true);
    expect(vectorTileLayer.props.filled).toBe(true);
    expect(vectorTileLayer.props.lineWidthScale).toBe(0.5);
    expect(vectorTileLayer.props.lineWidthMinPixels).toBe(1);
    expect(vectorTileLayer.props.getLineColor).toEqual([218, 112, 191, 204]);
    expect(vectorTileLayer.props.getFillColor).toBeDefined();
    expect(vectorTileLayer.props.getRadius).toBe(10);
    expect(vectorTileLayer.props.opacity).toBe(0.8);
  });

  test('h3 tile layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'h3layer',
              type: 'hexagonId',
              config: {
                dataId: 'DATA_TILESET_H3_ID',
                label: 'H3 Hexagons',
                color: [18, 147, 154],
                columns: {
                  hex_id: 'h3'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  colorRange: {
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  coverage: 0.9
                }
              },
              visualChannels: {
                colorField: {
                  name: 'value',
                  type: 'integer'
                },
                colorScale: 'quantile'
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`H3TileLayer({id: 'h3layer'})`]);
    
    const h3Layer = map.layers[0] as H3TileLayer;
    expect(h3Layer.props.id).toBe('h3layer');
    expect(h3Layer.props.data).toBe(DATASETS[5].data);
    expect(h3Layer.props.pickable).toBe(true);
    expect(h3Layer.props.opacity).toBe(0.8);
    expect(h3Layer.props.coverage).toBe(0.9);
    expect(h3Layer.props.getFillColor).toBeDefined();
  });

  test('quadbin tile layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'quadbinLayer',
              type: 'quadbin',
              config: {
                dataId: 'DATA_TILESET_QUADBIN_ID',
                label: 'Quadbin Grid',
                color: [18, 147, 154],
                columns: {
                  quadbin: 'quadbin'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  colorRange: {
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  }
                }
              },
              visualChannels: {
                colorField: {
                  name: 'value',
                  type: 'integer'
                },
                colorScale: 'quantile'
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`QuadbinTileLayer({id: 'quadbinLayer'})`]);
    
    const quadbinLayer = map.layers[0] as QuadbinTileLayer;
    expect(quadbinLayer.props.id).toBe('quadbinLayer');
    expect(quadbinLayer.props.data).toBe(DATASETS[6].data);
    expect(quadbinLayer.props.pickable).toBe(true);
    expect(quadbinLayer.props.opacity).toBe(0.8);
    expect(quadbinLayer.props.getFillColor).toBeDefined();
  });

  test('heatmap layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'heatmap1',
              type: 'heatmap',
              config: {
                dataId: 'DATA_ID',
                label: 'Heat Map',
                color: [18, 147, 154],
                columns: {
                  lat: 'latitude',
                  lng: 'longitude'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  colorRange: {
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  radius: 20
                }
              },
              visualChannels: {
                weightField: {
                  name: 'value',
                  type: 'integer'
                }
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`HeatmapTileLayer({id: 'heatmap1'})`]);
    
    const heatmapLayer = map.layers[0] as HeatmapTileLayer;
    expect(heatmapLayer.props.id).toBe('heatmap1');
    expect(heatmapLayer.props.data).toBe(DATASETS[0].data);
    expect(heatmapLayer.props.pickable).toBe(true);
    expect(heatmapLayer.props.opacity).toBe(0.8);
    expect(heatmapLayer.props.radius).toBe(20);
    expect(heatmapLayer.props.colorRange).toEqual(['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']);
  });

  test('grid layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'grid1',
              type: 'grid',
              config: {
                dataId: 'DATA_ID',
                label: 'Grid',
                color: [18, 147, 154],
                columns: {
                  lat: 'latitude',
                  lng: 'longitude'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  worldUnitSize: 1000,
                  colorRange: {
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  coverage: 0.9,
                  elevationScale: 10
                }
              },
              visualChannels: {
                colorField: {
                  name: 'value',
                  type: 'integer'
                },
                colorScale: 'quantile',
                sizeField: {
                  name: 'size',
                  type: 'integer'
                },
                sizeScale: 'linear'
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`GridLayer({id: 'grid1'})`]);
    
    const gridLayer = map.layers[0] as GridLayer;
    expect(gridLayer.props.id).toBe('grid1');
    expect(gridLayer.props.data).toBe(DATASETS[0].data);
    expect(gridLayer.props.pickable).toBe(true);
    expect(gridLayer.props.opacity).toBe(0.8);
    expect(gridLayer.props.cellSize).toBe(1000);
    expect(gridLayer.props.coverage).toBe(0.9);
    expect(gridLayer.props.elevationScale).toBe(10);
    expect(gridLayer.props.colorRange).toEqual(['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']);
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
                isVisible: true
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    expect(map.layers).toEqual([undefined]);
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
                isVisible: true
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    expect(map.layers).toEqual([undefined]);
  });

  test('hexagon layer', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'hex1',
              type: 'hexagon',
              config: {
                dataId: 'DATA_ID',
                label: 'Hexagon Layer',
                columns: {
                  lat: 'latitude',
                  lng: 'longitude'
                },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  worldUnitSize: 1000,
                  resolution: 8,
                  colorRange: {
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  coverage: 0.95,
                  sizeRange: [0, 500],
                  percentile: [0, 100],
                  elevationPercentile: [0, 100],
                  elevationScale: 5,
                  enableElevationZoomFactor: true,
                  colorAggregation: 'average',
                  sizeAggregation: 'sum',
                  enable3d: true
                }
              },
              visualChannels: {
                colorField: {name: 'value', type: 'integer'},
                colorScale: 'quantile',
                sizeField: {name: 'size', type: 'integer'},
                sizeScale: 'linear'
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([`HexagonLayer({id: 'hex1'})`]);
    
    const hexLayer = map.layers[0] as HexagonLayer;
    expect(hexLayer.props.id).toBe('hex1');
    expect(hexLayer.props.data).toBe(DATASETS[0].data);
    expect(hexLayer.props.pickable).toBe(true);
    expect(hexLayer.props.opacity).toBe(0.8);
    expect(hexLayer.props.coverage).toBe(0.95);
    expect(hexLayer.props.radius).toBe(1000);
    expect(hexLayer.props.extruded).toBe(true);
    expect(hexLayer.props.elevationScale).toBe(5);
    expect(hexLayer.props.colorRange).toEqual(['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']);
  });

  test('multiple layers', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'grid1',
              type: 'grid',
              config: {
                dataId: 'DATA_ID',
                label: 'Grid',
                isVisible: true,
                visConfig: {opacity: 0.8}
              }
            },
            {
              id: 'hex1',
              type: 'hexagon',
              config: {
                dataId: 'DATA_ID',
                label: 'Hexagons',
                isVisible: true,
                visConfig: {opacity: 0.6}
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.toString())).toEqual([
      `GridLayer({id: 'grid1'})`,
      `HexagonLayer({id: 'hex1'})`
    ]);
    
    expect(map.layers[0].props.opacity).toBe(0.8);
    expect(map.layers[1].props.opacity).toBe(0.6);
  });

  test('layer visibility', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'visible',
              type: 'grid',
              config: {
                dataId: 'DATA_ID',
                label: 'Visible Layer',
                isVisible: true
              }
            },
            {
              id: 'hidden',
              type: 'grid',
              config: {
                dataId: 'DATA_ID',
                label: 'Hidden Layer',
                isVisible: false
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    
    expect(map.layers.map(l => l.props.visible)).toEqual([true, false]);
  });

  test('layer with invalid data format', () => {
    const keplerMapConfig = {
      version: 'v1',
      config: {
        visState: {
          layers: [
            {
              id: 'layer1',
              type: 'geojson',
              config: {
                dataId: 'DATA_JSON_ID', // Points to non-GeoJSON data
                label: 'Invalid Data Layer',
                isVisible: true
              }
            }
          ]
        }
      }
    };

    const map = parseMap({...METADATA, datasets: DATASETS, keplerMapConfig});
    expect(map.layers).toEqual([undefined]);
  });
});
