import {describe, test, expect} from 'vitest';
import {
  getColorAccessor,
  getSizeAccessor,
  getTextAccessor,
  getLayer,
  _domainFromValues,
} from '@carto/api-client';

describe('layer-map', () => {
  const colors = [
    '#5A1846',
    '#900C3F',
    '#C70039',
    '#E3611C',
    '#F1920E',
    '#FFC300',
  ];

  describe('color accessors', () => {
    const COLOR_TESTS = [
      {
        colorField: {name: 'v'},
        colorScale: 'linear',
        colorRange: {colors},
        opacity: 1,
        data: [{v: 0}, {v: 1}, {v: 5}],
        d: {v: 0},
        expected: [90, 24, 70, 255],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'linear',
        colorRange: {colors},
        opacity: 0.5,
        data: [{v: 0}, {v: 1}, {v: 5}],
        d: {v: 1},
        expected: [101, 22, 69, 186],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'linear',
        colorRange: {colors},
        opacity: 0.5,
        data: {
          type: 'FeatureCollection',
          features: [
            {properties: {v: 0}},
            {properties: {v: 1}},
            {properties: {v: 5}},
          ],
        },
        d: {properties: {v: 1}},
        expected: [101, 22, 69, 186],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'linear',
        colorRange: {colors},
        opacity: 0.5,
        data: [{}], // Default range will be [0, 1]
        d: {v: 0.5},
        expected: [117, 18, 67, 186],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'custom',
        colorRange: {
          colors,
          colorMap: [
            [0, '#E3611C'],
            [1, '#F1920E'],
            [5, '#FFC300'],
          ],
        },
        opacity: 1,
        data: [{v: 0}, {v: 1}, {v: 5}],
        d: {v: 0},
        expected: [241, 146, 14, 255],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'ordinal',
        colorRange: {
          colors,
          colorMap: [
            [0, '#E3611C'],
            [1, '#F1920E'],
            [5, '#FFC300'],
          ],
        },
        opacity: 1,
        data: [{v: 0}, {v: 1}, {v: 5}],
        d: {v: 0},
        expected: [227, 97, 28, 255],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'ordinal',
        colorRange: {
          colors,
          colorMap: [[99, '#E3611C']],
        },
        opacity: 1,
        data: [{v: 0}, {v: 1}, {v: 5}],
        d: {v: 0},
        expected: [134, 141, 145, 255],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'quantile',
        colorRange: {
          colors,
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {attribute: 'v', quantiles: {6: [1, 2, 3, 4, 5, 6]}},
                ],
              },
            ],
          },
        },
        d: {properties: {v: 1}},
        expected: [90, 24, 70, 255],
      },
      {
        colorField: {name: 'v'},
        colorScale: 'quantile',
        colorRange: {
          colors,
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {
                    attribute: 'v',
                    quantiles: {global: {6: [1, 2, 3, 4, 5, 6]}},
                  },
                ],
              },
            ],
          },
        },
        d: {properties: {v: 3.5}},
        expected: [227, 97, 28, 255],
      },
    ];

    test.each(COLOR_TESTS)('getColorAccessor $colorScale', (testCase) => {
      const accessor = getColorAccessor(
        testCase.colorField,
        testCase.colorScale,
        {range: testCase.colorRange},
        testCase.opacity,
        testCase.data
      );
      expect(accessor(testCase.d)).toEqual(testCase.expected);
    });
  });

  describe('size accessors', () => {
    const SIZE_TESTS = [
      {
        sizeField: {name: 'v'},
        sizeScale: 'linear',
        sizeRange: [0, 1000],
        data: [{v: 1}, {v: 5}, {v: 10}],
        d: {v: 1},
        expected: 0,
      },
      {
        sizeField: {name: 'v'},
        sizeScale: 'sqrt',
        sizeRange: [100, 1000],
        data: [{v: 1}, {v: 5}, {v: 10}],
        d: {v: 1},
        expected: 100,
      },
      {
        sizeField: {name: 'v'},
        sizeScale: 'log',
        sizeRange: [0, 1000],
        data: [{v: 1}, {v: 10}],
        d: {v: 5},
        expected: 698.9700043360187,
      },
      {
        sizeField: {name: 'v'},
        sizeScale: 'point',
        sizeRange: [0, 1000],
        data: [{v: 'a'}, {v: 'b'}, {v: 'c'}],
        d: {v: 'b'},
        expected: 500,
      },
    ];

    test.each(SIZE_TESTS)('getSizeAccessor $sizeScale', (testCase) => {
      const accessor = getSizeAccessor(
        testCase.sizeField,
        testCase.sizeScale,
        undefined,
        testCase.sizeRange,
        testCase.data
      );
      expect(accessor(testCase.d)).toBe(testCase.expected);
    });
  });

  describe('text accessors', () => {
    const TEXT_TESTS = [
      {
        textLabelField: {name: 'date', type: 'date'},
        data: {date: '2021-10-29T13:25:01.067Z'},
        expected: '10/29/21 13:25:01pm',
      },
      {
        textLabelField: {name: 'field', type: 'integer'},
        data: {field: 1234},
        expected: '1234',
      },
      {
        textLabelField: {name: 'field', type: 'float'},
        data: {field: 5.18},
        expected: '5.18000',
      },
      {
        textLabelField: {name: 'ts', type: 'timestamp'},
        data: {ts: '2021-10-29T13:25:01.067Z'},
        expected: '1635513901',
      },
    ];

    test.each(TEXT_TESTS)(
      'getTextAccessor $textLabelField.type',
      (testCase) => {
        const accessor = getTextAccessor(testCase.textLabelField, [
          testCase.data,
        ]);
        expect(accessor(testCase.data)).toBe(testCase.expected);
      }
    );
  });

  test('throws error for deprecated layer types', () => {
    const deprecatedTypes = [
      'geojson',
      'grid',
      'heatmap',
      'hexagon',
      'hexagonId',
      'point',
    ];

    deprecatedTypes.forEach((type) => {
      expect(() => getLayer(type as any, {columns: {}}, {}, {})).toThrow(
        `Outdated layer type: ${type}. Please open map in CARTO Builder to automatically migrate.`
      );
    });
  });

  test('domainFromValues', () => {
    expect(_domainFromValues(['a', 'a', 'b', 'c', 'b'], 'ordinal')).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(_domainFromValues([1, 4, 2, 3, 1], 'quantile')).toEqual([
      1, 1, 2, 3, 4,
    ]);
    expect(_domainFromValues([1, 0, -3], 'log')).toEqual([-3, 1]);
    expect(_domainFromValues([1, 0, 3], 'log')).toEqual([0.00001, 3]);
    expect(_domainFromValues(['a', 'c', 'b', 'c', 'a'], 'point')).toEqual([
      'a',
      'c',
      'b',
    ]);
  });
});
