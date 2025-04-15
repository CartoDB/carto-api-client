import {describe, test, expect} from 'vitest';
import {
  SpatialIndex,
  getColumnNameFromGeoColumn,
  getSpatialIndexFromGeoColumn,
  scaleAggregationResLevel,
} from '@carto/api-client';

describe('getColumnNameFromGeoColumn', () => {
  test('should return undefined for undefined input', () => {
    expect(getColumnNameFromGeoColumn(undefined)).toBeUndefined();
  });

  test('should return null for null input', () => {
    expect(getColumnNameFromGeoColumn(null)).toBeNull();
  });

  test('should return the column name when no prefix is present', () => {
    expect(getColumnNameFromGeoColumn('geom')).toBe('geom');
  });

  test('should return the column name when prefix is present', () => {
    expect(getColumnNameFromGeoColumn('h3:geom')).toBe('geom');
  });

  test('should return null for invalid format', () => {
    expect(getColumnNameFromGeoColumn('h3:geom:extra')).toBeNull();
  });
});

describe('getSpatialIndexFromGeoColumn', () => {
  test('should return H3 for h3 prefix', () => {
    expect(getSpatialIndexFromGeoColumn('h3:geom')).toBe(SpatialIndex.H3);
  });

  test('should return QUADBIN for quadbin prefix', () => {
    expect(getSpatialIndexFromGeoColumn('quadbin:geom')).toBe(SpatialIndex.QUADBIN);
  });

  test('should return null for unknown prefix', () => {
    expect(getSpatialIndexFromGeoColumn('unknown:geom')).toBeNull();
  });

  test('should return null for no prefix', () => {
    expect(getSpatialIndexFromGeoColumn('geom')).toBeNull();
  });
});

describe('scaleAggregationResLevel', () => {
  test('should return undefined for non-number input', () => {
    expect(scaleAggregationResLevel(undefined, 0.5)).toBeUndefined();
  });

  test('should scale the resolution level correctly for 0.5 tile resolution', () => {
    expect(scaleAggregationResLevel(5, 0.5)).toBe(5);
  });

  test('should scale the resolution level correctly for 0.25 tile resolution', () => {
    expect(scaleAggregationResLevel(5, 0.25)).toBe(4);
  });

  test('should scale the resolution level correctly for 0.125 tile resolution', () => {
    expect(scaleAggregationResLevel(5, 0.125)).toBe(3);
  });
}); 