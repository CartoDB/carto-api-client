import {assertType, test} from 'vitest';
import {
  AggregationType,
  Filter,
  FilterLogicalOperator,
  FilterType,
  GroupDateType,
  SpatialFilter,
} from '@carto/api-client';

/**
 * NOTICE: Testing types with Vitest is experimental. For now, it is possible that these
 * tests can 'pass' even if the type assertions fail.
 */

test('AggregationType', () => {
  assertType<AggregationType>('count');
  assertType<AggregationType>('avg');
  assertType<AggregationType>('min');
  assertType<AggregationType>('max');
  assertType<AggregationType>('sum');
  assertType<AggregationType>('custom');

  // @ts-expect-error
  assertType<AggregationType>('invalid');
});

test('SpatialFilter', () => {
  assertType<SpatialFilter>({
    type: 'Polygon',
    coordinates: [
      [
        [-73.98003634607416, 40.83231510177447],
        [-73.98949373574811, 40.831963176524745],
        [-73.99885974707679, 40.83091080115276],
        [-74.00804389326515, 40.829168143611824],
        [-73.98003634607416, 40.83231510177447],
      ],
    ],
  });

  assertType<SpatialFilter>({
    // @ts-expect-error
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [102.0, 0.5]},
    properties: {prop0: 'value0'},
  });

  // @ts-expect-error
  assertType<SpatialFilter>({type: 'Point', coordinates: [102.0, 0.5]});
});

test('FilterType', () => {
  assertType<FilterType>(FilterType.IN);
  assertType<FilterType>(FilterType.BETWEEN);
  assertType<FilterType>(FilterType.CLOSED_OPEN);
  assertType<FilterType>(FilterType.TIME);
  assertType<FilterType>(FilterType.STRING_SEARCH);

  // @ts-expect-error
  assertType<FilterType>('invalid');
});

test('Filter', () => {
  assertType<Filter>({});
  assertType<Filter>({in: {values: [4, 8]}});
  assertType<Filter>({between: {values: [[4, 8]]}});
  assertType<Filter>({stringSearch: {values: ['a', 'b', 'c']}});

  // @ts-expect-error
  assertType<Filter>({invalid: [4, 8]});
});

test('FilterLogicalOperator', () => {
  assertType<FilterLogicalOperator>('and');
  assertType<FilterLogicalOperator>('or');

  // @ts-expect-error
  assertType<FilterLogicalOperator>('invalid');
});

test('GroupDateType', () => {
  assertType<GroupDateType>('year');
  assertType<GroupDateType>('month');
  assertType<GroupDateType>('week');
  assertType<GroupDateType>('day');
  assertType<GroupDateType>('hour');
  assertType<GroupDateType>('minute');
  assertType<GroupDateType>('second');

  // @ts-expect-error
  assertType<GroupDateType>('invalid');
});
