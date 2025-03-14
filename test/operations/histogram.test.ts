import {describe, test, expect} from 'vitest';
import {histogram} from '@carto/api-client';

const VALUES = [1, 2, 2, 3, 3, 3, 4, 4, 5];

const COLUMN = 'test';

const VALID_DATA = [...Array(VALUES.length)].map((_, idx) => ({
  [COLUMN]: VALUES[idx],
  [COLUMN + '_2']: VALUES[idx],
}));

const INVALID_DATA = [{[COLUMN]: null}, {[COLUMN]: undefined}];

const ticks = Array.from(new Set(VALUES));

describe('histogram', () => {
  test('should return an empty array due to empty features array', () => {
    expect(
      histogram({data: [], valuesColumns: [], ticks: [], operation: 'count'})
    ).toEqual([]);
  });

  describe('valid features', () => {
    test('should throw due to invalid operation', () => {
      expect(() =>
        histogram({
          data: VALID_DATA,
          valuesColumns: [COLUMN],
          ticks,
          // @ts-ignore
          operation: 'pow',
        })
      ).toThrow();
    });

    test('should return an array of bins with same length as ticks plus two, due to the addition of extreme values', () => {
      const h = histogram({
        data: VALID_DATA,
        valuesColumns: [COLUMN],
        ticks,
        operation: 'count',
      });
      expect(h.length).toBe(1 + ticks.length);
    });

    const RESULTS = {
      count: [0, 1, 2, 3, 2, 1],
      avg: [0, 1, 2, 3, 4, 5],
      min: [0, 1, 2, 3, 4, 5],
      max: [0, 1, 2, 3, 4, 5],
      sum: [0, 1, 4, 9, 8, 5],
    };

    describe('one valuesColumns', () => {
      Object.entries(RESULTS).forEach(([operation, result]) => {
        test(operation, () => {
          const groups = histogram({
            data: VALID_DATA,
            valuesColumns: [COLUMN],
            ticks,
            // @ts-ignore
            operation,
          });
          expect(groups).toEqual(result);
        });
      });
    });

    describe('multiple valuesColumns', () => {
      const RESULTS_FOR_MULTIPLE = Object.entries(RESULTS).reduce(
        (acc, [operation, result], idx) => {
          acc[operation] = result.map(
            (value) =>
              // === 0 is AggregationTypes.COUNT
              value * (idx === 0 ? 1 : 2)
          );
          return acc;
        },
        {}
      );

      Object.entries(RESULTS_FOR_MULTIPLE).forEach(([operation, result]) => {
        test(operation, () => {
          const groups = histogram({
            data: VALID_DATA,
            valuesColumns: [COLUMN, `${COLUMN}_2`],
            joinOperation: 'sum',
            ticks: ticks.map((tick) => tick * 2),
            // @ts-ignore
            operation,
          });
          expect(groups).toEqual(result);
        });
      });
    });
  });

  describe('invalid features', () => {
    test('should return all bins values to 0 due to invalid column data', () => {
      const h = histogram({
        data: INVALID_DATA,
        valuesColumns: [COLUMN],
        ticks,
        operation: 'count',
      });
      expect(h).toEqual([0, 0, 0, 0, 0, 0]);
    });
  });
});
