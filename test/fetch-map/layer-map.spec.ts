import {describe, test, expect} from 'vitest';
import {
  getColorAccessor,
  getTextAccessor,
  getLayerProps,
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
        title: 'colorMap always win',
        colorField: {name: 'v'},
        colorScale: 'ordinal',
        colorRange: {
          colors,
          colorMap: [
            ['b', colors[0]],
            ['a', colors[1]],
            ['c', colors[2]],
          ],
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {
                    attribute: 'v',
                    categories: [{category: 'a'}, {category: 'b'}],
                  },
                ],
              },
            ],
          },
        },
        d: {properties: {v: 'b'}},
        expected: [90, 24, 70, 255],
      },
      {
        title: 'quantile',
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
        title: 'quantile (2)',
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

    test.each(COLOR_TESTS)('getColorAccessor $title', (testCase) => {
      const {accessor, range} = getColorAccessor(
        testCase.colorField,
        testCase.colorScale,
        {range: testCase.colorRange},
        testCase.opacity,
        testCase.data
      );
      expect(accessor(testCase.d)).toEqual(testCase.expected);
      expect(range).toEqual(testCase.colorRange.colors);
    });
  });

  // describe('size accessors', () => {
  //   // TODO add test cases using tilestats data
  //   const SIZE_TESTS = [];

  //   test.each(SIZE_TESTS)('getSizeAccessor $sizeScale', (testCase) => {
  //     const accessor = getSizeAccessor(
  //       testCase.sizeField,
  //       testCase.sizeScale,
  //       undefined,
  //       testCase.sizeRange,
  //       testCase.data
  //     );
  //     expect(accessor(testCase.d)).toBe(testCase.expected);
  //   });
  // });

  describe('text accessors', () => {
    const TEXT_TESTS = [
      {
        textLabelField: {name: 'date', type: 'date'},
        data: {date: '2021-10-29T13:25:01.067Z'},
        expected: '10/29/21, 1:25:01 PM',
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
      expect(() => getLayerProps(type as any, {} as any, {} as any)).toThrow(
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
