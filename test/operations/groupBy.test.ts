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
      }).rows
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
        }).rows
      ).toEqual([]);
    });

    const RESULTS = {
      count: [
        {name: 'Category 2', value: 3},
        {name: 'Category 1', value: 2},
      ],
      avg: [
        {name: 'Category 1', value: 3},
        {name: 'Category 2', value: 3},
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
          expect(groups?.rows).toEqual(result);
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
          const rows = groupValuesByColumn({
            data: VALID_DATA,
            valuesColumns: [
              `${COLUMN}_quantitative`,
              `${COLUMN}_quantitative_2`,
            ],
            joinOperation: 'sum',
            keysColumn: `${COLUMN}_qualitative`,
            // @ts-ignore
            operation,
          }).rows;
          expect(rows).toEqual(result);
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
        expect(groups).toEqual({
          rows: [
            {name: 'TX', value: 1600},
            {name: 'IL', value: 500},
            {name: 'FL', value: 400},
            {name: 'CA', value: 200},
            {name: 'NY', value: 100},
          ],
          metadata: {
            others: 700,
          },
        });
      });
      test('should support othersThreshold with count', () => {
        const groups = groupValuesByColumn({
          data: dataForOthersTests,
          valuesColumns: [`state`],
          keysColumn: `state`,
          othersThreshold: 3,
          operation: 'count',
        });
        expect(groups).toEqual({
          rows: [
            {name: 'TX', value: 3},
            {name: 'IL', value: 2},
            {name: 'CA', value: 1},
            {name: 'FL', value: 1},
            {name: 'NY', value: 1},
          ],
          metadata: {
            others: 2,
          },
        });
      });
      test('should support othersThreshold with and orderBy', () => {
        const groups = groupValuesByColumn({
          data: dataForOthersTests,
          valuesColumns: [`state`],
          keysColumn: `state`,
          othersThreshold: 3,
          operation: 'count',
          orderBy: 'alphabetical_asc',
        });
        expect(groups).toEqual({
          rows: [
            {name: 'CA', value: 1},
            {name: 'FL', value: 1},
            {name: 'IL', value: 2},
            {name: 'NY', value: 1},
            {name: 'TX', value: 3},
          ],
          metadata: {
            others: 4,
          },
        });
      });
    });

    describe('orderBy', () => {
      const defaultParams = {
        data: dataForOthersTests,
        valuesColumns: [`value`],
        keysColumn: `state`,
        operation: 'count' as const,
      };
      test('should support alphabetical_asc', () => {
        expect(
          groupValuesByColumn({...defaultParams, orderBy: 'alphabetical_asc'})
            .rows
        ).toEqual([
          {name: 'CA', value: 1},
          {name: 'FL', value: 1},
          {name: 'IL', value: 2},
          {name: 'NY', value: 1},
          {name: 'TX', value: 3},
        ]);
      });
      test('should support alphabetical_desc', () => {
        expect(
          groupValuesByColumn({...defaultParams, orderBy: 'alphabetical_desc'})
            .rows
        ).toEqual([
          {name: 'TX', value: 3},
          {name: 'NY', value: 1},
          {name: 'IL', value: 2},
          {name: 'FL', value: 1},
          {name: 'CA', value: 1},
        ]);
      });
      test('should support frequency_asc', () => {
        expect(
          groupValuesByColumn({...defaultParams, orderBy: 'frequency_asc'}).rows
        ).toEqual([
          {name: 'CA', value: 1},
          {name: 'FL', value: 1},
          {name: 'NY', value: 1},
          {name: 'IL', value: 2},
          {name: 'TX', value: 3},
        ]);
      });
      test('should support frequency_desc', () => {
        expect(
          groupValuesByColumn({...defaultParams, orderBy: 'frequency_desc'})
            .rows
        ).toEqual([
          {name: 'TX', value: 3},
          {name: 'IL', value: 2},
          {name: 'CA', value: 1},
          {name: 'FL', value: 1},
          {name: 'NY', value: 1},
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
      }).rows;
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
      }).rows;
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
