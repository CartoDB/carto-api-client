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

  test('should return the column name when no prefix is present', () => {
    expect(getColumnNameFromGeoColumn('random')).toBe('random');
    expect(getColumnNameFromGeoColumn('geom')).toBe('geom');
  });

  test('should return the column name when prefix is present', () => {
    expect(getColumnNameFromGeoColumn('geom:h3')).toBe('h3');
    expect(getColumnNameFromGeoColumn('h3:geom')).toBe('geom');
    expect(getColumnNameFromGeoColumn('quadbin:h3')).toBe('h3');
  });

  test('should return null for invalid format', () => {
    expect(getColumnNameFromGeoColumn('h3:geom:extra')).toBeNull();
  });
});

describe('getSpatialIndexFromGeoColumn', () => {
  test('should return null for standard geometry columns', () => {
    expect(getSpatialIndexFromGeoColumn('random')).toBeNull();
    expect(getSpatialIndexFromGeoColumn('geom')).toBeNull();
    expect(getSpatialIndexFromGeoColumn('geom:h3')).toBeNull();
  });

  test('should return H3 for all H3 variants', () => {
    const variants = ['h3', 'hex', 'h3id', 'hex_id', 'h3hex'];
    variants.forEach((variant) => {
      // Test standalone column
      expect(getSpatialIndexFromGeoColumn(variant)).toBe(SpatialIndex.H3);
      // Test with prefix
      expect(getSpatialIndexFromGeoColumn(`h3:${variant}`)).toBe(
        SpatialIndex.H3
      );
    });
  });

  test('should return QUADBIN for quadbin columns', () => {
    // Test standalone column
    expect(getSpatialIndexFromGeoColumn('quadbin')).toBe(SpatialIndex.QUADBIN);
    // Test with prefix
    expect(getSpatialIndexFromGeoColumn('quadbin:h3')).toBe(
      SpatialIndex.QUADBIN
    );
  });

  test('should return null for unknown prefix', () => {
    expect(getSpatialIndexFromGeoColumn('unknown:geom')).toBeNull();
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
