import {expect, test} from 'vitest';
import {tileFeatures, Tile, TileFormat} from '@carto/api-client';
import {
  cellToBoundary,
  getCellPolygon,
  tileToCell,
  bigIntToHex,
  cellToChildren,
  hexToBigInt,
} from 'quadbin';
import {buffer} from '@turf/buffer';

test('tileFeaturesRaster', () => {
  // Defines a parent tile at z=8.
  const parentTile = {z: 8, x: 59, y: 97};
  const parent = tileToCell(parentTile);
  const parentBbox = getCellPolygon(parent);
  const [east, north, _, south, west] = parentBbox;

  // Defines a child tile at NW quadrant of parent, z=9.
  const childTile = {z: 9, x: 118, y: 194};
  const child = tileToCell(childTile);

  // Creates a mock 'RasterTile' from the parent cell, with 8x8 pixel resolution
  // where each pixel has band_1 = 0.
  const tile = {
    id: bigIntToHex(parent),
    index: {q: parent, i: bigIntToHex(parent)},
    zoom: 8,
    isVisible: true,
    bbox: {west, east, north, south},
    data: {
      blockSize: 8,
      cells: {
        properties: [],
        numericProps: {
          band_1: {value: new Uint8Array(8 ** 2)},
        },
      },
    },
  } as unknown as Tile;

  // Filter to the NW quadrant with a slight inset to avoid precision issues.
  const spatialFilter = buffer(cellToBoundary(child), -0.01, {
    units: 'degrees',
  }).geometry;

  // Extract features, which should return all the upper quadrant,
  // of the parent tile, a 4x4 block of pixels.
  const features = tileFeatures({
    tiles: [tile],
    tileFormat: TileFormat.BINARY,
    spatialDataType: 'quadbin',
    spatialFilter,
  });

  expect(features.length).toBe(16);

  expect(features.map((f) => hexToBigInt(f.id as string))).toEqual(
    cellToChildren(child, 11n)
  );
});
