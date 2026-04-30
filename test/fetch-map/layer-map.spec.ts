import {describe, test, expect} from 'vitest';
import {
  getColorAccessor,
  getSizeAccessor,
  getTextAccessor,
  getLayerProps,
  _domainFromValues,
} from '@carto/api-client';
import {rgb} from 'd3-color';

const hexToRGBA = (c: any) => {
  const {r, g, b} = rgb(c);
  return [r, g, b, 255];
};

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
            ['d', colors[3]],
            ['e', colors[4]],
            ['f', colors[5]],
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
        // this case is for colorMap that contains 6 values, but actual (current)
        // domain is shorter for example thanks to filtering
        // We expect colorMap to override current attrubute stats and result in first color,
        // whether attribute stats would map 'b' to second color
        expected: hexToRGBA(colors[0]),
      },
      {
        title: 'quantize with length 2',
        colorField: {name: 'v'},
        colorScale: 'quantize',
        colorRange: {
          colors: colors.slice(0, 2),
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {
                    attribute: 'v',
                    min: 0,
                    max: 1,
                  },
                ],
              },
            ],
          },
        },
        d: {properties: {v: 0.5}},
        // quantize [0,1] with two colors should emit ranges [-Inf, 0.5) [0.5, Inf]
        // so we should result with second color
        expected: hexToRGBA(colors[1]),
      },
      {
        title: 'quantile with length 2',
        colorField: {name: 'v'},
        colorScale: 'quantile',
        colorRange: {
          colors: colors.slice(0, 4),
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {
                    attribute: 'v',
                    min: 0,
                    max: 1,
                    quantiles: {
                      3: [0, 0.33, 0.66, 1],
                      4: [0, 0.25, 0.5, 0.75, 1],
                    },
                  },
                ],
              },
            ],
          },
        },
        d: {properties: {v: '0.5'}},
        // our data is exactly median, and fits [0.5-0.75> so should be 3rd color
        expected: hexToRGBA(colors[2]),
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
                  {attribute: 'v', quantiles: {6: [1, 2, 3, 4, 5, 6, 7]}},
                ],
              },
            ],
          },
        },
        d: {properties: {v: 2}},
        // we expect v=2 to land in second range, that is [2-3)
        expected: hexToRGBA(colors[1]),
      },
      {
        title: 'quantiles, global',
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
                    quantiles: {global: {6: [1, 2, 3, 4, 5, 6, 7]}},
                  },
                ],
              },
            ],
          },
        },
        d: {properties: {v: 3.5}},
        // we expect v: 3.5 to land in 3rd range, that is [3, 4) so third color
        expected: hexToRGBA(colors[2]),
      },
      {
        title: 'ordinal overflow categories get unknown color',
        colorField: {name: 'v'},
        colorScale: 'ordinal',
        colorRange: {
          colors: colors.slice(0, 3), // only 3 palette colors
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {
                    attribute: 'v',
                    categories: [
                      {category: 'A'},
                      {category: 'B'},
                      {category: 'C'},
                      {category: 'D'},
                      {category: 'E'},
                      {category: 'F'},
                    ],
                  },
                ],
              },
            ],
          },
        },
        // Category D overflows the 3-color palette, should get grey "Others"
        d: {properties: {v: 'D'}},
        expected: [134, 141, 145, 255],
      },
      {
        title: 'hexColumn',
        colorField: {name: 'v', colorColumn: 'vColor'},
        colorScale: 'ordinal',
        colorRange: {
          colors: [],
          hexColor: true,
        },
        opacity: 1,
        data: {
          tilestats: {
            layers: [
              {
                attributes: [
                  {
                    attribute: 'v',
                    categories: [{category: 'foo'}],
                  },
                ],
              },
            ],
          },
        },
        d: {properties: {v: 'foo', vColor: '#ff00ff'}},
        // we expect v: 3.5 to land in 3rd range, that is [3, 4) so third color
        expected: hexToRGBA('#ff00ff'),
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

  describe('getColorAccessor accessorKey override', () => {
    const COLOR_ACCESSOR_KEY_TESTS = [
      {
        title: 'uses accessorKey when provided',
        field: {
          name: 'revenue',
          type: 'real',
          accessorKey: 'custom_agg_abc12345',
        },
        attribute: 'custom_agg_abc12345',
        properties: {custom_agg_abc12345: 50, revenue: 999},
      },
      {
        title: 'falls back to getAccessorKeys when accessorKey is absent',
        field: {name: 'v', type: 'real'},
        attribute: 'v',
        properties: {v: 50},
      },
    ];

    test.each(COLOR_ACCESSOR_KEY_TESTS)(
      'getColorAccessor $title',
      (testCase) => {
        const {accessor} = getColorAccessor(
          testCase.field,
          'quantize',
          {
            range: {
              colors: colors.slice(0, 2),
              name: '',
              type: '',
              category: '',
              colorMap: undefined,
            },
          },
          1,
          {
            tilestats: {
              layers: [
                {
                  attributes: [
                    {attribute: testCase.attribute, min: 0, max: 100},
                  ],
                },
              ],
            },
          }
        );
        const result = accessor({properties: testCase.properties});
        expect(result).toBeDefined();
        expect(result.length).toBe(4);
      }
    );

    test('accessorKey reads the aliased property, not the name-derived one', () => {
      const data = {
        tilestats: {
          layers: [
            {
              attributes: [
                {attribute: 'custom_agg_abc12345', min: 0, max: 100},
              ],
            },
          ],
        },
      };
      const range = {
        colors: colors.slice(0, 2),
        name: '',
        type: '',
        category: '',
        colorMap: undefined,
      };
      const {accessor: accessorWithKey} = getColorAccessor(
        {name: 'revenue', type: 'real', accessorKey: 'custom_agg_abc12345'},
        'quantize',
        {range},
        1,
        data
      );
      const resultWithKey = accessorWithKey({
        properties: {custom_agg_abc12345: 80, revenue: 20},
      });

      const {accessor: accessorNoKey} = getColorAccessor(
        {name: 'revenue', type: 'real'},
        'quantize',
        {range},
        1,
        {
          tilestats: {
            layers: [{attributes: [{attribute: 'revenue', min: 0, max: 100}]}],
          },
        }
      );
      const resultNoKey = accessorNoKey({properties: {revenue: 20}});

      expect(resultWithKey).not.toEqual(resultNoKey);
    });
  });

  describe('getSizeAccessor accessorKey override', () => {
    const SIZE_ACCESSOR_KEY_TESTS = [
      {
        title: 'uses accessorKey when provided',
        field: {
          name: 'population',
          type: 'real',
          accessorKey: 'custom_agg_def67890',
        },
        attribute: 'custom_agg_def67890',
        properties: {custom_agg_def67890: 500, population: 999},
      },
      {
        title: 'falls back to getAccessorKeys when accessorKey is absent',
        field: {name: 'population', type: 'real'},
        attribute: 'population',
        properties: {population: 500},
      },
    ];

    test.each(SIZE_ACCESSOR_KEY_TESTS)('getSizeAccessor $title', (testCase) => {
      const {accessor} = getSizeAccessor(
        testCase.field,
        'linear',
        undefined,
        [1, 10],
        {
          tilestats: {
            layers: [
              {
                attributes: [
                  {attribute: testCase.attribute, min: 0, max: 1000},
                ],
              },
            ],
          },
        }
      );
      const result = accessor({properties: testCase.properties});
      expect(typeof result).toBe('number');
    });

    test('accessorKey reads aliased property and produces the expected scaled value', () => {
      const {accessor} = getSizeAccessor(
        {
          name: 'population',
          type: 'real',
          accessorKey: 'custom_agg_def67890',
        },
        'linear',
        undefined,
        [1, 10],
        {
          tilestats: {
            layers: [
              {
                attributes: [
                  {attribute: 'custom_agg_def67890', min: 0, max: 1000},
                ],
              },
            ],
          },
        }
      );
      const result = accessor({
        properties: {custom_agg_def67890: 500, population: 100},
      });
      const scaledValue = 1 + (500 / 1000) * (10 - 1);
      expect(result).toBeCloseTo(scaledValue, 1);
    });
  });

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
