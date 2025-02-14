import {describe, test, expect} from 'vitest';
import {aggregate, aggregationFunctions} from '@carto/api-client';

const VALUES = [1, 2, 3, 4, 5];

const COLUMN = 'test';
const COLUMN_2 = 'test_2';

const features = [...Array(VALUES.length)].map((_, idx) => ({
  [COLUMN]: VALUES[idx],
  [COLUMN_2]: VALUES[idx] - 1,
}));

const featuresIncludingNull = [...Array(VALUES.length)].map((_, idx) => ({
  [COLUMN]: VALUES[idx],
  [COLUMN_2]: idx === 0 ? null : VALUES[idx],
}));

describe('aggregation', () => {
  describe('aggregationFunctions', () => {
    const RESULTS = {
      count: VALUES.length,
      avg: 3,
      min: 1,
      max: 5,
      sum: 15,
    };

    describe('by values', () => {
      Object.entries(RESULTS).forEach(([operation, result]) => {
        test(operation, () => {
          const func = aggregationFunctions[operation];
          expect(func(VALUES)).toEqual(result);
        });
      });
    });

    describe('by features', () => {
      describe('unique key', () => {
        Object.entries(RESULTS).forEach(([operation, result]) => {
          test(operation, () => {
            const func = aggregationFunctions[operation];
            expect(func(features, COLUMN)).toEqual(result);
          });
        });
      });

      describe('multiple keys', () => {
        const RESULTS_FOR_MULTIPLE_KEYS = {
          count: VALUES.length,
          avg: 2.5,
          min: 0,
          max: 5,
          sum: 25,
        };

        Object.entries(RESULTS_FOR_MULTIPLE_KEYS).forEach(
          ([operation, result]) => {
            test(operation, () => {
              const func = aggregationFunctions[operation];
              expect(func(features, [COLUMN, COLUMN_2], operation)).toEqual(
                result
              );
            });
          }
        );
      });

      describe('when value is null', () => {
        describe('by values', () => {
          const RESULTS = {
            count: VALUES.length,
            avg: 3,
            min: 1,
            max: 5,
            sum: 12,
          };

          Object.entries(RESULTS).forEach(([operation, result]) => {
            test(operation, () => {
              const func = aggregationFunctions[operation];
              expect(func([1, 2, null, 4, 5])).toEqual(result);
            });
          });
        });

        describe('by features', () => {
          const RESULTS = {
            count: VALUES.length,
            avg: 3.5,
            min: 2,
            max: 5,
            sum: 14,
          };

          Object.entries(RESULTS).forEach(([operation, result]) => {
            test(operation, () => {
              const func = aggregationFunctions[operation];
              expect(
                func(featuresIncludingNull, [COLUMN_2], operation)
              ).toEqual(result);
            });
          });
        });

        describe('multiple keys', () => {
          const RESULTS_FOR_MULTIPLE_KEYS = {
            count: VALUES.length,
            avg: 3,
            min: 1,
            max: 5,
            sum: 29,
          };

          Object.entries(RESULTS_FOR_MULTIPLE_KEYS).forEach(
            ([operation, result]) => {
              test(operation, () => {
                const func = aggregationFunctions[operation];
                expect(
                  func(featuresIncludingNull, [COLUMN, COLUMN_2], operation)
                ).toEqual(result);
              });
            }
          );
        });
      });
    });
  });

  describe("aggregate feature's properties", () => {
    // It should only access the feature's property
    test('should work correctly with one column', () => {
      features.forEach((feature) => {
        const aggregatedValue = aggregate(feature, [COLUMN]);
        expect(aggregatedValue).toEqual(feature[COLUMN]);
      });
    });

    test('should aggregate two columns correctly', () => {
      features.forEach((feature) => {
        const aggregatedValue = aggregate(feature, [COLUMN, COLUMN_2], 'sum');
        expect(aggregatedValue).toEqual(feature[COLUMN] + feature[COLUMN_2]);
      });
    });

    test("throws an error if joinOperation isn't valid", () => {
      const feature = features[0];
      expect(() =>
        // @ts-ignore
        aggregate(feature, [COLUMN, COLUMN_2], '__unknown__')
      ).toThrowError();
    });

    test("throws an error if passed keys aren't valid", () => {
      const feature = features[0];
      // @ts-ignore
      expect(() => aggregate(feature, [], '__unknown__')).toThrowError();
      // @ts-ignore
      expect(() => aggregate(feature, null, '__unknown__')).toThrowError();
    });
  });
});
