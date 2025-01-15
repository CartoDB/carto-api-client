import {describe, test, expect} from 'vitest';
import {
  AggregationType,
  GroupDateType,
  groupValuesByDateColumn,
} from '@carto/api-client';

const REVENUE = 50;

const DATES_VALUES = [
  Date.UTC(1970, 0, 1, 0, 0),
  Date.UTC(1970, 0, 1, 0, 30),
  Date.UTC(1970, 1, 1, 0, 0),
  Date.UTC(1970, 1, 1, 0, 30),
  Date.UTC(1971, 0, 1, 1, 0),
];

const DATE_COLUMN = 'test_date';
const OPERATION_COLUMN = 'test_revenue';
const OPERATION_COLUMN_2 = 'test_revenue_2';

const FEATURES = DATES_VALUES.map((value) => ({
  [DATE_COLUMN]: value,
  [OPERATION_COLUMN]: REVENUE,
  [OPERATION_COLUMN_2]: REVENUE,
}));

describe('groupValuesByDateColumn', () => {
  test('should return null due to empty data array', () => {
    expect(
      groupValuesByDateColumn({data: [], keysColumn: '', groupType: 'day'})
    ).toEqual(null);
  });

  describe('valid features', () => {
    test('should return null due to invalid grouping operation', () => {
      expect(
        groupValuesByDateColumn({
          data: FEATURES,
          valuesColumns: [OPERATION_COLUMN],
          keysColumn: DATE_COLUMN,
          // @ts-ignore
          groupType: '__fake_group_type__',
          operation: 'count',
        })
      ).toEqual(null);
    });

    test('should throw due to invalid operation', () => {
      expect(() =>
        groupValuesByDateColumn({
          data: FEATURES,
          valuesColumns: [OPERATION_COLUMN],
          keysColumn: DATE_COLUMN,
          groupType: 'day',
          // @ts-ignore
          operation: '__fake_operation__',
        })
      ).toThrow();
    });

    describe('grouping operation tests', () => {
      const COMMON_PARAMS = {
        data: FEATURES,
        valuesColumns: [OPERATION_COLUMN],
        keysColumn: DATE_COLUMN,
      };

      const RESULTS = [
        {
          groupType: 'year',
          result: [
            {name: Date.UTC(1970, 0, 1), value: 4},
            {name: Date.UTC(1971, 0, 1), value: 1},
          ],
        },
        {
          groupType: 'month',
          result: [
            {name: Date.UTC(1970, 0, 1), value: 2},
            {name: Date.UTC(1970, 1, 1), value: 2},
            {name: Date.UTC(1971, 0, 1), value: 1},
          ],
        },
        {
          groupType: 'week',
          result: [
            {name: Date.UTC(1969, 11, 29), value: 2},
            {name: Date.UTC(1970, 0, 26), value: 2},
            {name: Date.UTC(1970, 11, 28), value: 1},
          ],
        },
        {
          groupType: 'day',
          result: [
            {name: Date.UTC(1970, 0, 1), value: 2},
            {name: Date.UTC(1970, 1, 1), value: 2},
            {name: Date.UTC(1971, 0, 1), value: 1},
          ],
        },
        {
          groupType: 'hour',
          result: [
            {name: Date.UTC(1970, 0, 1, 0, 0), value: 2},
            {name: Date.UTC(1970, 1, 1, 0, 0), value: 2},
            {name: Date.UTC(1971, 0, 1, 1, 0), value: 1},
          ],
        },
        {
          groupType: 'minute',
          result: DATES_VALUES.map((dateValue) => ({
            name: dateValue,
            value: 1,
          })),
        },
        {
          groupType: 'second',
          result: DATES_VALUES.map((dateValue) => ({
            name: dateValue,
            value: 1,
          })),
        },
      ];

      describe('one valuesColumns', () => {
        test.each(RESULTS)('groupType: $groupType', ({groupType, result}) => {
          // count
          expect(
            groupValuesByDateColumn({
              ...COMMON_PARAMS,
              groupType: groupType as GroupDateType,
              operation: 'count',
            })
          ).toEqual(result);

          // sum
          expect(
            groupValuesByDateColumn({
              ...COMMON_PARAMS,
              groupType: groupType as GroupDateType,
              operation: 'sum',
            })
          ).toEqual(
            result.map((item) => ({
              ...item,
              value: item.value * REVENUE,
            }))
          );
        });
      });

      describe('multiple valuesColumns', () => {
        const COMMON_PARAMS_FOR_MULTIPLE = {
          ...COMMON_PARAMS,
          valuesColumns: [OPERATION_COLUMN, OPERATION_COLUMN_2],
          joinOperation: 'sum' as const,
        };

        test.each(RESULTS)('groupType: $groupType', ({groupType, result}) => {
          // count
          expect(
            groupValuesByDateColumn({
              ...COMMON_PARAMS_FOR_MULTIPLE,
              groupType: groupType as GroupDateType,
              operation: 'count',
            })
          ).toEqual(result);

          // sum
          expect(
            groupValuesByDateColumn({
              ...COMMON_PARAMS_FOR_MULTIPLE,
              groupType: groupType as GroupDateType,
              operation: 'sum',
            })
          ).toEqual(
            result.map((item) => ({
              ...item,
              value: item.value * REVENUE * 2,
            }))
          );
        });
      });
    });
  });

  describe('invalid features', () => {
    test('invalid date columns are not taken into consideration', () => {
      const h = groupValuesByDateColumn({
        data: [{[DATE_COLUMN]: '__non_number__', [OPERATION_COLUMN]: 100}],
        valuesColumns: [OPERATION_COLUMN],
        keysColumn: DATE_COLUMN,
        groupType: 'day',
      });
      expect(h).toEqual([]);
    });
  });
});
