import {describe, expect, test} from 'vitest';
import {POINTS_BINARY_DATA, POLYGONS_BINARY_DATA} from './__fixtures.js';
import {
  buildBinaryFeatureFilter,
  _buildFeatureFilter,
  FilterLogicalOperator,
} from '@carto/api-client';

const filters = {
  column1: {
    in: {
      owner: 'widgetId1',
      values: ['a', 'b', 'c'],
    },
  },
  column2: {
    between: {
      owner: 'widgetId2',
      values: [[1, 2, 3]],
    },
  },
  column3: {
    time: {
      owner: 'widgetId3',
      values: [[0, 1]],
    },
  },
  column4: {
    stringSearch: {
      owner: 'widgetId4',
      values: ['Álcàlâ dë Guadaíra'],
    },
  },
};

const makeFeatureWithValueInColumn = (value = 1, column = 'column1') => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0, 0],
  },
  properties: {
    [column]: value,
  },
});

const makeObjectWithValueInColumn = (value = 1, column = 'column1') => ({
  [column]: value,
});

describe('Filters', () => {
  test('should return 1 if no filters present', () => {
    const params = {filters: {}, type: 'number' as const};
    const feature = makeFeatureWithValueInColumn();
    expect(_buildFeatureFilter(params)(feature)).toBe(1);
  });

  test('should return true if no filters present', () => {
    const params = {filters: {}, type: 'boolean' as const};
    const feature = makeFeatureWithValueInColumn();
    expect(_buildFeatureFilter(params)(feature)).toBe(true);
  });

  describe('feature passes filter - boolean type', () => {
    const params = {filters, type: 'boolean' as const};

    describe('should return false if feature column value is falsy', () => {
      const columnValues = [0, null, undefined, false, ''];
      for (const value of columnValues) {
        test(`${value} - with geojson feature`, () => {
          const feature = makeFeatureWithValueInColumn(value as any);
          const withProps = _buildFeatureFilter(params)(feature);
          expect(withProps).toBe(false);
        });
      }

      for (const value of columnValues) {
        test(`${value} - with geojson feature properties`, () => {
          const obj = makeObjectWithValueInColumn(value as any);
          const noProps = _buildFeatureFilter(params)(obj);
          expect(noProps).toBe(false);
        });
      }
    });

    describe('should throw if filter function is not implemented', () => {
      const paramsWithFilterFunctionNotImplemented = {
        filters: {
          ...filters,
          column1: {
            pow: {},
          },
        },
        type: 'boolean' as const,
      };

      test('with geojson feature', () => {
        const filter = _buildFeatureFilter(
          paramsWithFilterFunctionNotImplemented as any
        );
        const feature = makeFeatureWithValueInColumn();
        expect(() => filter(feature)).toThrow(
          '"pow" filter is not implemented'
        );
      });

      test('with geojson feature properties', () => {
        const filter = _buildFeatureFilter(
          paramsWithFilterFunctionNotImplemented as any
        );
        const obj = makeObjectWithValueInColumn();
        expect(() => filter(obj)).toThrow('"pow" filter is not implemented');
      });
    });

    test('should return true if feature passes filter', () => {
      const feature = {
        properties: {
          column1: 'a',
          column2: 1.5,
          column3: 1,
          column4: 'Alcalá de Guadaíra',
        },
      };
      const featureIsIncluded = _buildFeatureFilter(params)(feature);
      expect(featureIsIncluded).toBe(true);
    });

    test('should return false if feature not passes filter', () => {
      const feature = {
        properties: {
          column1: 'a',
          column2: 3,
          column3: '1999',
          column4: 'test',
        },
      };
      const featureIsIncluded = _buildFeatureFilter(params)(feature);
      expect(featureIsIncluded).toBe(false);
    });
  });

  describe('feature passes filter - number type', () => {
    const params = {filters, type: 'number' as const};

    describe('should return 0 if feature column value is null or undefined', () => {
      const nullOrUndefinedAreNotValid = {
        filters: {
          column1: {between: {owner: 'widgetId1', values: [[-1, 1]]}},
        },
        type: 'number' as const,
      };

      const notIncludedFeatures = [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [0, 0]},
          properties: {column1: null},
        },
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [0, 0]},
          properties: {column1: undefined},
        },
      ];

      for (const feature of notIncludedFeatures) {
        test(`${feature.properties.column1} - with geojson feature`, () => {
          const isFeatureIncluded = _buildFeatureFilter(
            nullOrUndefinedAreNotValid
          )(feature);
          expect(isFeatureIncluded).toBe(0);
        });
      }

      const notIncludedObjects = [{column1: null}, {column1: undefined}];
      for (const obj of notIncludedObjects) {
        test(`${obj.column1} - with geojson feature properties`, () => {
          const isFeatureIncluded = _buildFeatureFilter(
            nullOrUndefinedAreNotValid
          )(obj);
          expect(isFeatureIncluded).toBe(0);
        });
      }
    });

    describe('should return 1 if feature column value has a legit 0', () => {
      const zeroIsValidForThisFilter = {
        filters: {
          column1: {between: {owner: 'widgetId1', values: [[-1, 1]]}},
        },
        type: 'number' as const,
      };

      test(`ZERO - with geojson feature`, () => {
        const feature = makeFeatureWithValueInColumn(0);
        const isFeatureIncluded = _buildFeatureFilter(zeroIsValidForThisFilter)(
          feature
        );
        expect(isFeatureIncluded).toBe(1);
      });

      test(`ZERO - with geojson feature properties`, () => {
        const obj = makeObjectWithValueInColumn(0);
        const isFeatureIncluded = _buildFeatureFilter(zeroIsValidForThisFilter)(
          obj
        );
        expect(isFeatureIncluded).toBe(1);
      });
    });

    describe('should throw if filter function is not implemented', () => {
      const paramsWithFilterFunctionNotImplemented = {
        filters: {
          ...filters,
          column1: {
            pow: {},
          },
        },
        type: 'number',
      };

      test('with geojson feature', () => {
        const filter = _buildFeatureFilter(
          paramsWithFilterFunctionNotImplemented as any
        );
        const feature = makeFeatureWithValueInColumn();
        expect(() => filter(feature)).toThrow(
          '"pow" filter is not implemented'
        );
      });

      test('with geojson feature properties', () => {
        const filter = _buildFeatureFilter(
          paramsWithFilterFunctionNotImplemented as any
        );
        const obj = makeObjectWithValueInColumn();
        expect(() => filter(obj)).toThrow('"pow" filter is not implemented');
      });
    });

    test('should return 1 if feature passes filter', () => {
      const feature = {
        properties: {
          column1: 'a',
          column2: 1.5,
          column3: '1970',
          column4: 'Alcalá de Guadaíra',
        },
      };
      const featureIsIncluded = _buildFeatureFilter(params)(feature);
      expect(featureIsIncluded).toBe(1);
    });

    test('should return 0 if feature not passes filter', () => {
      const feature = {
        properties: {
          column1: 'a',
          column2: 3,
          column3: -1,
          column4: 'test',
        },
      };
      const featureIsIncluded = _buildFeatureFilter(params)(feature);
      expect(featureIsIncluded).toBe(0);
    });

    describe('should manage number filters using ClosedOpen interval checks', () => {
      const zeroIsValidForThisFilter = {
        filters: {
          column1: {closed_open: {owner: 'widgetId1', values: [[10, 20]]}},
        },
        type: 'number' as const,
      };

      test(`left endpoint is ALWAYS included - with geojson feature`, () => {
        const feature = makeFeatureWithValueInColumn(10);
        const isFeatureIncluded = _buildFeatureFilter(zeroIsValidForThisFilter)(
          feature
        );
        expect(isFeatureIncluded).toBe(1);
      });

      test(`rigth endpoint is NEVER included - with geojson feature`, () => {
        const feature = makeFeatureWithValueInColumn(20);
        const isFeatureIncluded = _buildFeatureFilter(zeroIsValidForThisFilter)(
          feature
        );
        expect(isFeatureIncluded).toBe(0);
      });

      test(`left endpoint is ALWAYS included - with geojson feature properties`, () => {
        const obj = makeObjectWithValueInColumn(10);
        const isFeatureIncluded = _buildFeatureFilter(zeroIsValidForThisFilter)(
          obj
        );
        expect(isFeatureIncluded).toBe(1);
      });

      test(`rigth endpoint is NEVER included - with geojson feature properties`, () => {
        const obj = makeObjectWithValueInColumn(20);
        const isFeatureIncluded = _buildFeatureFilter(zeroIsValidForThisFilter)(
          obj
        );
        expect(isFeatureIncluded).toBe(0);
      });
    });
  });

  describe('feature passes filter - logical OR operator', () => {
    const params = {
      filtersLogicalOperator: 'or' as FilterLogicalOperator,
      filters: {
        column1: {
          in: {
            values: [1],
          },
        },
        column2: {
          in: {
            values: [2],
          },
        },
      },
    };

    test('should pass if only first column passes', () => {
      const feature = {properties: {column1: 1, column2: null}};
      const result = _buildFeatureFilter(params)(feature);
      expect(result).toBe(true);
    });
    test('should pass if only second column passes', () => {
      const feature = {properties: {column1: null, column2: 2}};
      const result = _buildFeatureFilter(params)(feature);
      expect(result).toBe(true);
    });
    test('should pass if both columns pass', () => {
      const feature = {properties: {column1: 1, column2: 2}};
      const result = _buildFeatureFilter(params)(feature);
      expect(result).toBe(true);
    });
    test('should not pass if none of the columns pass', () => {
      const feature = {properties: {column1: null, column2: null}};
      const result = _buildFeatureFilter(params)(feature);
      expect(result).toBe(false);
    });
  });

  describe('using binary data', () => {
    test('should filter points binary data', () => {
      const filterForBinaryData = {
        state: {
          in: {
            values: ['AK'],
          },
        },
      };
      const filterFn = buildBinaryFeatureFilter({filters: filterForBinaryData});

      const filterRes = POINTS_BINARY_DATA.featureIds.value.map(
        (_, idx: number) => filterFn(idx, POINTS_BINARY_DATA) as number
      );

      expect(filterRes[0]).toBe(1);
      expect(filterRes[filterRes.length - 1]).toBe(0);
    });

    test('should filter polygons/lines binary data', () => {
      const filterForBinaryData = {
        cartodb_id: {
          in: {
            values: [78],
          },
        },
      };

      const filterFn = buildBinaryFeatureFilter({filters: filterForBinaryData});

      const filterRes = POLYGONS_BINARY_DATA.featureIds.value.map(
        (_, idx: number) => filterFn(idx, POLYGONS_BINARY_DATA) as number
      );

      expect(filterRes[0]).toBe(1);
      expect(filterRes[filterRes.length - 1]).toBe(0);
    });

    test('should throw error when filter is unknown', () => {
      const filterForBinaryData = {
        cartodb_id: {
          pow: {
            values: [1],
          },
        },
      };

      const filterFn = buildBinaryFeatureFilter({
        filters: filterForBinaryData,
      } as any);

      expect(() => filterFn(0, POLYGONS_BINARY_DATA)).toThrow(
        '"pow" filter is not implemented'
      );
    });

    test('should returns always 0 when values is nullish', () => {
      const filterForBinaryData = {
        cartodb_id: {
          in: {
            values: null,
          },
        },
      };

      const filterFn = buildBinaryFeatureFilter({filters: filterForBinaryData});

      const filterRes = POLYGONS_BINARY_DATA.featureIds.value.map(
        (_, idx: number) => filterFn(idx, POLYGONS_BINARY_DATA) as number
      );

      expect(filterRes.every((el) => el === 0)).toBe(true);
    });
  });
});
