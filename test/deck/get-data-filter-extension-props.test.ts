import {describe, test, expect} from 'vitest';
import {getDataFilterExtensionProps} from '@carto/api-client';
import {Feature} from 'geojson';

describe('getDataFilterExtensionProps', () => {
  test('filters', () => {
    const filters = {
      storetype: {
        in: {
          values: ['Supermarket'],
          owner: 'revenueByStoreType',
        },
      },
      revenue: {
        closed_open: {
          values: [[1400000, 1500000]],
          owner: 'storesByRevenue',
        },
      },
    };
    const featurePassesFilter: Feature = {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [0, 0]},
      properties: {
        storetype: 'Supermarket',
        revenue: 1400001,
      },
    };
    const featureNotFilter: Feature = {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [0, 0]},
      properties: {
        storetype: 'Supermarket',
        revenue: 100,
      },
    };
    const {filterRange, updateTriggers, getFilterValue} =
      getDataFilterExtensionProps(filters);

    expect(filterRange.length).toBe(4);

    filterRange.forEach((range, index) => {
      expect(range).toStrictEqual(index === 0 ? [1, 1] : [0, 0]);
    });

    expect(updateTriggers.getFilterValue).toBe(JSON.stringify(filters));
    expect(getFilterValue(featurePassesFilter)).toStrictEqual([1, 0, 0, 0]);
    expect(getFilterValue(featureNotFilter)).toStrictEqual([0, 0, 0, 0]);
  });
});

test('time', () => {
  const offsetBy = 473380000000;
  const filters = {
    storetype: {
      in: {
        values: ['Supermarket'],
        owner: 'revenueByStoreType',
      },
    },
    dateTime: {
      time: {
        values: [[473385600000, 504921600000]],
        owner: 'storesByRevenue',
        params: {offsetBy},
      },
    },
  };

  const feature: Feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [0, 0]},
    properties: {
      storetype: 'Supermarket',
      dateTime: 473385600001,
    },
  };

  const {filterRange, updateTriggers, getFilterValue} =
    getDataFilterExtensionProps(filters);

  expect(filterRange.length).toBe(4);

  filterRange.forEach((range, index) => {
    if (index === 0) {
      expect(range).toStrictEqual([1, 1]);
    } else if (index === 1) {
      expect(range).toStrictEqual(
        filters.dateTime.time.values[0].map((v) => v - offsetBy)
      );
    } else {
      expect(range).toStrictEqual([0, 0]);
    }
  });

  expect(updateTriggers.getFilterValue).toBe(
    JSON.stringify({...filters, dateTime: {offsetBy, time: {}}})
  );

  expect(getFilterValue(feature)).toStrictEqual([
    1,
    feature.properties.dateTime - offsetBy,
    0,
    0,
  ]);
});
