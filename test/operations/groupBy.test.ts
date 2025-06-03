import {describe, test, expect} from 'vitest';
import {groupValuesByColumn} from '@carto/api-client';

const COLUMN = 'test';

const VALID_DATA = buildValidData(COLUMN);
const INVALID_DATA = buildInvalidData(COLUMN);

describe('groupValuesByColumn', () => {
  test('should return null due to empty data array', () => {
    expect(
      groupValuesByColumn({
        data: [],
        valuesColumns: [],
        keysColumn: 'any',
        operation: 'count',
      })
    ).toEqual(null);
  });

  describe('valid features', () => {
    test('should return an empty array due to invalid operation', () => {
      expect(
        groupValuesByColumn({
          data: VALID_DATA,
          valuesColumns: [`${COLUMN}_quantitative`],
          keysColumn: `${COLUMN}_qualitative`,
          // @ts-ignore
          operation: 'pow',
        })
      ).toEqual([]);
    });

    const RESULTS = {
      count: [
        {name: 'Category 2', value: 3},
        {name: 'Category 1', value: 2},
      ],
      avg: [
        {name: 'Category 2', value: 3},
        {name: 'Category 1', value: 3},
      ],
      min: [
        {name: 'Category 1', value: 2},
        {name: 'Category 2', value: 1},
      ],
      max: [
        {name: 'Category 2', value: 5},
        {name: 'Category 1', value: 4},
      ],
      sum: [
        {name: 'Category 2', value: 9},
        {name: 'Category 1', value: 6},
      ],
    };

    describe('one valuesColumns', () => {
      Object.entries(RESULTS).forEach(([operation, result]) => {
        test(operation, () => {
          const groups = groupValuesByColumn({
            data: VALID_DATA,
            valuesColumns: [`${COLUMN}_quantitative`],
            keysColumn: `${COLUMN}_qualitative`,
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
          acc[operation] = result.map(({name, value}) => ({
            name,
            // === 0 is AggregationTypes.COUNT
            value: value * (idx === 0 ? 1 : 2),
          }));
          return acc;
        },
        {}
      );

      Object.entries(RESULTS_FOR_MULTIPLE).forEach(([operation, result]) => {
        test(operation, () => {
          const groups = groupValuesByColumn({
            data: VALID_DATA,
            valuesColumns: [
              `${COLUMN}_quantitative`,
              `${COLUMN}_quantitative_2`,
            ],
            joinOperation: 'sum',
            keysColumn: `${COLUMN}_qualitative`,
            // @ts-ignore
            operation,
          });
          expect(groups).toEqual(result);
        });
      });
    });

    describe('othersThreshold', () => {
      test('should support othersThreshold with sum', () => {
        const groups = groupValuesByColumn({
          data: dataForOthersTests,
          valuesColumns: [`value`],
          keysColumn: `state`,
          othersThreshold: 2,
          operation: 'sum',
        });
        expect(groups).toEqual([
          {name: 'TX', value: 1600},
          {name: 'IL', value: 500},
          {name: 'FL', value: 400},
          {name: 'CA', value: 200},
          {name: 'NY', value: 100},
          {name: '_carto_others', value: 700},
        ]);
      });
      test('should support othersThreshold with count', () => {
        const groups = groupValuesByColumn({
          data: dataForOthersTests,
          valuesColumns: [`state`],
          keysColumn: `state`,
          othersThreshold: 3,
          operation: 'count',
        });
        expect(groups).toEqual([
          {name: 'TX', value: 3},
          {name: 'IL', value: 2},
          {name: 'NY', value: 1},
          {name: 'CA', value: 1},
          {name: 'FL', value: 1},
          {name: '_carto_others', value: 2},
        ]);
      });
    });
  });

  describe('invalid features', () => {
    test('should count nulls when operation is COUNT', () => {
      const groups = groupValuesByColumn({
        data: INVALID_DATA,
        valuesColumns: [`${COLUMN}_quantitative`],
        keysColumn: `${COLUMN}_qualitative`,
        operation: 'count',
      });
      expect(groups).toEqual([
        {
          name: 'Category 1',
          value: 1,
        },
        {
          name: 'Category 2',
          value: 0,
        },
      ]);
    });
    test('should return all groups values to 0 due to invalid column data for operations other than COUNT', () => {
      const groups = groupValuesByColumn({
        data: INVALID_DATA,
        valuesColumns: [`${COLUMN}_quantitative`],
        keysColumn: `${COLUMN}_qualitative`,
        operation: 'sum',
      });
      expect(groups).toEqual([
        {
          name: 'Category 1',
          value: 0,
        },
        {
          name: 'Category 2',
          value: 0,
        },
      ]);
    });
  });
});

const dataForOthersTests = [
  {state: 'NY', value: 100},
  {state: 'CA', value: 200},
  {state: 'FL', value: 400},
  {state: 'IL', value: 400},
  {state: 'IL', value: 100},
  {state: 'TX', value: 300},
  {state: 'TX', value: 600},
  {state: 'TX', value: 700},
];
// Aux

function buildValidData(columnName) {
  const VALUES = [1, 2, 3, 4, 5];
  return [...Array(VALUES.length)].map((_, idx) => ({
    [`${columnName}_qualitative`]: `Category ${idx % 2 === 0 ? 2 : 1}`, // 2 categories === 'Category 1' && 3 categories === 'Category 2'
    [`${columnName}_quantitative`]: VALUES[idx],
    [`${columnName}_quantitative_2`]: VALUES[idx],
  }));
}

function buildInvalidData(columnName) {
  return [
    {
      [`${columnName}_qualitative`]: 'Category 1',
      [`${columnName}_quantitative`]: null,
    },
    {
      [`${columnName}_qualitative`]: 'Category 2',
      [`${columnName}_quantitative`]: undefined,
    },
  ];
}
