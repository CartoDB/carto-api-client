import {describe, it, expect} from 'vitest';
import {
  _getRasterTileLayerStyleProps as getRasterTileLayerStyleProps,
  RasterMetadata,
  RasterMetadataBandStats,
} from '@carto/api-client';

const dummyColorRange = {
  type: 'custom',
  category: 'carto',
  colors: ['#ff0000', '#00ff00', '#0000ff'],
  name: 'dummy colors',
  colorMap: [],
};

const dummyLayerConfig = {
  dataId: 'data',
  visConfig: {
    colorRange: undefined,
    radius: 5,
  },
  label: '',
  isVisible: false,
  isConfigActive: false,
  color: [],
  textLabel: [],
  columns: {},
  colorUI: {},
  highlightColor: [255, 128, 128, 0],
  hidden: false,
};

const dummyStats: RasterMetadataBandStats = {
  min: 0,
  max: 255,
  mean: 100,
  stddev: 3,
  sum: 2333,
  sum_squares: 3322,
  count: 1000,
  quantiles: {
    3: [50, 100],
    4: [60, 110, 150],
  },
  top_values: {
    0: 400,
    1: 300,
    2: 100,
    3: 100,
    25: 100,
  },
};

const dummyRasterMetadataRgb: RasterMetadata = {
  block_resolution: 1,
  minresolution: 10,
  maxresolution: 10,
  nodata: 255,
  bounds: [-170, -80, 170, 80],
  center: [0, 0, 12],
  bands: [
    {
      type: 'uint8',
      name: 'band_1',
      nodata: '255',
      stats: dummyStats,
      colorinterp: 'red',
    },
    {
      type: 'uint8',
      name: 'band_2',
      nodata: '255',
      stats: dummyStats,
      colorinterp: 'green',
    },
    {
      type: 'uint8',
      name: 'band_3',
      nodata: '255',
      stats: dummyStats,
      colorinterp: 'blue',
    },
  ],
  width: 0,
  height: 0,
  block_width: 0,
  block_height: 0,
  num_blocks: 0,
  num_pixels: 0,
  pixel_resolution: 0,
};

const dummyRasterMetadataRandom: RasterMetadata = {
  ...dummyRasterMetadataRgb,
  bands: [
    {
      type: 'uint8',
      name: 'band_xxx',
      nodata: '255',
      stats: dummyStats,
    },
    {
      type: 'uint8',
      name: 'band_yyy',
      nodata: '255',
      stats: dummyStats,
    },
  ],
};

const defaultQualitativeColor = {
  name: 'Pastel',
  type: 'qualitative',
  category: 'CARTO',
  colors: [
    '#66C5CC',
    '#F6CF71',
    '#F89C74',
    '#DCB0F2',
    '#87C55F',
    '#9EB9F3',
    '#FE88B1',
    '#C9DB74',
    '#8BE0A4',
    '#B497E7',
    '#D3B484',
    '#B3B3B3',
  ],
  colorMap: [],
};

describe('getRasterTileLayerStyleProps', () => {
  const getFillColorRgba = (data, index) => {
    const instanceFillColors = data.data.attributes?.instanceFillColors;
    if (instanceFillColors) {
      const bufferIndex = index * 4;
      return [
        instanceFillColors[bufferIndex + 0],
        instanceFillColors[bufferIndex + 1],
        instanceFillColors[bufferIndex + 2],
        instanceFillColors[bufferIndex + 3],
      ];
    }
    return undefined;
  };

  const getFillColorHex = (a, b) => {
    const rgba = getFillColorRgba(a, b);
    return rgba && rgbToHex(rgba).toUpperCase();
  };

  const runFillColorTests = (testValues, info) => {
    testValues.forEach(({expected}, index) => {
      const getFillColor =
        typeof expected === 'string' ? getFillColorHex : getFillColorRgba;
      expect(getFillColor(info, index)).toEqual(expected);
    });
  };
  it('rgb', () => {
    const {dataTransform} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'Rgb',
          colorBands: [
            {band: 'red', type: 'band', value: 'band_1'},
            {band: 'green', type: 'band', value: 'band_2'},
            {band: 'blue', type: 'band', value: 'band_3'},
          ],
        },
      },
      rasterMetadata: dummyRasterMetadataRandom,
      visualChannels: {},
    });
    const testValues = [
      {
        input: {band_1: 123, band_2: 33, band_3: 233, band_xxx: 0},
        expected: [123, 33, 233, 255],
      },
      {
        input: {band_1: 255, band_2: 33, band_3: 111, band_xxx: 0},
        expected: [255, 33, 111, 255],
      },

      // feature3: all _used_ bands in given pixel are nodata -> skip pixel
      {
        input: {band_1: 255, band_2: 255, band_3: 255, band_xxx: 333},
        expected: [0, 0, 0, 0],
      },
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => input)
    );

    runFillColorTests(testValues, info);
  });

  it('rgb expressions', () => {
    const {dataTransform} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'Rgb',
          colorBands: [
            {band: 'red', type: 'expression', value: 'band_1 - 1'}, // vec - scalar
            {band: 'green', type: 'expression', value: 'band_2 * band_1'}, // vec * vec
            {
              band: 'blue',
              type: 'expression',
              value: '(band_3 + band_2 + band_1)/3',
            }, // parentheses + vec / scalar
          ],
        },
      },
      rasterMetadata: dummyRasterMetadataRandom,
      visualChannels: {},
    });

    const testValues = [
      {
        input: {band_1: 1, band_2: 2, band_3: 3, band_xxx: 0},
        expected: [1 - 1, 2 * 1, (3 + 2 + 1) / 3, 255],
      },
      {
        input: {band_1: 10, band_2: 20, band_3: 30, band_xxx: 0},
        expected: [10 - 1, 20 * 10, (30 + 20 + 10) / 3, 255],
      },

      // feature3: all _used_ bands in given pixel are nodata -> skip pixel
      {
        input: {band_1: 255, band_2: 255, band_3: 255, band_xxx: 111},
        expected: [0, 0, 0, 0],
      },
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => input)
    );

    runFillColorTests(testValues, info);
  });

  it('colorRange / quantile', () => {
    const {dataTransform, ...scaleProps} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'ColorRange',
          colorRange: {
            ...dummyColorRange,
            colors: ['#ff0000', '#00ff00', '#0000ff'],
          },
        },
      },
      rasterMetadata: dummyRasterMetadataRgb,
      visualChannels: {
        colorScale: 'quantile',
        colorField: {
          name: 'band_1',
          type: 'integer',
        },
      },
    });

    expect(scaleProps).toMatchObject({
      type: 'quantile',
      field: {name: 'band_1', type: 'integer'},
      domain: [0, 50, 100, 255],
      scaleDomain: [0, 50, 100, 255],
      range: ['#ff0000', '#00ff00', '#0000ff'],
    });

    const testValues = [
      {input: 40, expected: [255, 0, 0, 255]},
      {input: 60, expected: [0, 255, 0, 255]},
      {input: 110, expected: [0, 0, 255, 255]},
      {input: 255, expected: [0, 0, 0, 0]}, // nodata -> transparent
    ];
    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => ({band_1: input}))
    );

    runFillColorTests(testValues, info);
  });

  it('colorRange / quantize', () => {
    const {dataTransform, ...scaleProps} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'ColorRange',
          colorRange: {
            ...dummyColorRange,
            colors: ['#ff0000', '#00ff00', '#0000ff'],
          },
        },
      },
      rasterMetadata: dummyRasterMetadataRgb,
      visualChannels: {
        colorScale: 'quantize',
        colorField: {
          name: 'band_1',
          type: 'integer',
        },
      },
    });

    expect(scaleProps).toMatchObject({
      type: 'quantize',
      field: {name: 'band_1', type: 'integer'},
      domain: [0, 255],
      scaleDomain: [0, 255],
      range: ['#ff0000', '#00ff00', '#0000ff'],
    });

    const testValues = [
      {input: 10, expected: [255, 0, 0, 255]},
      // { input: 123, expected: [0, 255, 0, 255] },

      {input: 240, expected: [0, 0, 255, 255]},
      {input: 255, expected: [0, 0, 0, 0]}, // nodata -> transparent
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => ({band_1: input}))
    );

    runFillColorTests(testValues, info);
  });
  it('colorRange / 10', () => {
    const {dataTransform, ...scaleProps} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'ColorRange',
          colorRange: {
            ...dummyColorRange,
            colors: ['#ff0000', '#00ff00', '#0000ff'],
            uiCustomScaleType: 'logarithmic',
          },
        },
      },
      rasterMetadata: dummyRasterMetadataRgb,
      visualChannels: {
        colorScale: 'custom',
        colorField: {
          name: 'band_1',
          type: 'integer',
        },
      },
    });

    expect(scaleProps).toMatchObject({
      type: 'custom',
      field: {name: 'band_1', type: 'integer'},
      domain: [0, 255],
      scaleDomain: [10, 100],
      range: ['#ff0000', '#00ff00', '#0000ff'],
    });

    const testValues = [
      {input: 4, expected: [255, 0, 0, 255]},
      {input: 15, expected: [0, 255, 0, 255]},
      {input: 150, expected: [0, 0, 255, 255]},
      {input: 255, expected: [0, 0, 0, 0]}, // nodata -> transparent
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => ({band_1: input}))
    );

    runFillColorTests(testValues, info);
  });
  it('colorRange / custom', () => {
    const {dataTransform, ...scaleProps} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'ColorRange',
          colorRange: {
            ...dummyColorRange,
            colors: ['#ff0000', '#00ff00', '#0000ff'],
            colorMap: [
              [10, '#ff0000'],
              [100, '#00ff00'],
              [null, '#0000ff'],
            ],
          },
        },
      },
      rasterMetadata: dummyRasterMetadataRgb,
      visualChannels: {
        colorScale: 'custom',
        colorField: {
          name: 'band_1',
          type: 'integer',
        },
      },
    });

    expect(scaleProps).toMatchObject({
      type: 'custom',
      field: {name: 'band_1', type: 'integer'},
      domain: [0, 255],
      scaleDomain: [10, 100, null],
      range: ['#ff0000', '#00ff00', '#0000ff'],
    });

    const testValues = [
      {input: 4, expected: [255, 0, 0, 255]},
      {input: 15, expected: [0, 255, 0, 255]},
      {input: 150, expected: [0, 0, 255, 255]},
      {input: 255, expected: [0, 0, 0, 0]}, // nodata -> transparent
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => ({band_1: input}))
    );

    runFillColorTests(testValues, info);
  });

  it('uniqueValue / default', () => {
    const {dataTransform, ...scaleProps} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'UniqueValues',
          uniqueValuesColorRange: {
            ...defaultQualitativeColor,
            colorMap: [0, 1, 2, 3, 25].map((v, i) => [
              v,
              defaultQualitativeColor.colors[i],
            ]),
          },
        },
      },
      rasterMetadata: dummyRasterMetadataRgb,
      visualChannels: {
        colorField: {
          name: 'band_1',
          type: 'integer',
        },
      },
    });

    expect(scaleProps).toMatchObject({
      type: 'ordinal',
      field: {name: 'band_1', type: 'integer'},
      domain: [0, 1, 2, 3, 25],
      scaleDomain: [0, 1, 2, 3, 25],
      range: defaultQualitativeColor.colors,
    });

    const testValues = [
      {input: 0, expected: defaultQualitativeColor.colors[0]},
      {input: 1, expected: defaultQualitativeColor.colors[1]},
      {input: 2, expected: defaultQualitativeColor.colors[2]},
      {input: 3, expected: defaultQualitativeColor.colors[3]},
      {input: 25, expected: defaultQualitativeColor.colors[4]},
      {input: 255, expected: [0, 0, 0, 0]}, // nodata -> transparent
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => ({band_1: input}))
    );

    runFillColorTests(testValues, info);
  });
  it('uniqueValue / custom', () => {
    const {dataTransform, ...scaleProps} = getRasterTileLayerStyleProps({
      layerConfig: {
        ...dummyLayerConfig,
        visConfig: {
          ...dummyLayerConfig.visConfig,
          rasterStyleType: 'UniqueValues',
          uniqueValuesColorRange: {
            ...dummyColorRange,
            colorMap: [
              [0, '#ff0000'],
              [1, '#00ff00'],
              [2, '#0000ff'],
            ],
            colors: ['#ff0000', '#00ff00', '#0000ff'],
          },
        },
      },
      rasterMetadata: dummyRasterMetadataRgb,
      visualChannels: {
        colorScale: 'quantile',
        colorField: {
          name: 'band_1',
          type: 'integer',
        },
      },
    });

    expect(scaleProps).toMatchObject({
      type: 'ordinal',
      field: {name: 'band_1', type: 'integer'},
      domain: [0, 1, 2],
      scaleDomain: [0, 1, 2],
      range: ['#ff0000', '#00ff00', '#0000ff'],
    });

    const testValues = [
      {input: 0, expected: [255, 0, 0, 255]},
      {input: 1, expected: [0, 255, 0, 255]},
      {input: 2, expected: [0, 0, 255, 255]},
      {input: 255, expected: [0, 0, 0, 0]}, // nodata -> transparent
    ];

    const info = makeWrappedObjectInfo(
      dataTransform,
      ...testValues.map(({input}) => ({band_1: input}))
    );

    runFillColorTests(testValues, info);
  });
});

function makeWrappedObjectInfo(
  dataTransform,
  ...features: Record<string, number>[]
) {
  const data = {
    length: features.length,
    data: {
      blockSize: 1,
      cells: {
        numericProps: Object.entries(features[0]).reduce(
          (agg, [key]) => ({
            ...agg,
            [key]: {value: new Float32Array(features.map((f) => f[key]))},
          }),
          {}
        ),
      },
    },
  };
  return {
    index: 0,
    data: dataTransform ? dataTransform(data) : data,
  };
}

function rgbToHex(rgbColorArray: number[]): string {
  return `#${rgbColorArray[0].toString(16).padStart(2, '0')}${rgbColorArray[1]
    .toString(16)
    .padStart(2, '0')}${rgbColorArray[2].toString(16).padStart(2, '0')}`;
}
