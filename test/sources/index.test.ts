import {describe, expect, test} from 'vitest';
import {CARTO_SOURCES} from '@carto/api-client';

describe('sources index', () => {
  test('CARTO_SOURCES exports all source functions', () => {
    expect(CARTO_SOURCES).toBeDefined();
    expect(typeof CARTO_SOURCES).toBe('object');

    const expectedSources = [
      'boundaryQuerySource',
      'boundaryTableSource',
      'h3QuerySource',
      'h3TableSource',
      'h3TilesetSource',
      'rasterSource',
      'quadbinQuerySource',
      'quadbinTableSource',
      'quadbinTilesetSource',
      'vectorQuerySource',
      'vectorTableSource',
      'vectorTilesetSource',
      'trajectoryQuerySource',
      'trajectoryTableSource',
    ];

    expectedSources.forEach((sourceName) => {
      expect(CARTO_SOURCES).toHaveProperty(sourceName);
      expect(
        typeof CARTO_SOURCES[sourceName as keyof typeof CARTO_SOURCES]
      ).toBe('function');
    });

    expect(Object.keys(CARTO_SOURCES)).toHaveLength(expectedSources.length);
  });
});

