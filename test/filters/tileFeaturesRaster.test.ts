import {describe, expect, test} from 'vitest';
import {
  tileFeatures,
  Tile,
  TileFormat,
  RasterMetadata,
  RasterMetadataBandStats,
} from '@carto/api-client';
import {cellToBoundary, getCellPolygon, tileToCell, bigIntToHex} from 'quadbin';
import {buffer} from '@turf/buffer';

describe('tileFeaturesRaster', () => {
  // Defines a parent tile at z=8.
  const parentTile = {z: 8, x: 59, y: 97};
  const parent = tileToCell(parentTile);
  const parentBbox = getCellPolygon(parent);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [east, north, _, south, west] = parentBbox;

  // Defines a child tile at NW quadrant of parent, z=9.
  const childTile = {z: 9, x: 118, y: 194};
  const child = tileToCell(childTile);

  test('pixels', () => {
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
            band_1: {value: new Uint8Array(8 ** 2).fill(127)},
          },
        },
      },
    } as unknown as Tile;

    const rasterMetadata: Partial<RasterMetadata> = {
      bands: [
        {
          name: 'band_1',
          nodata: 0,
          type: 'uint8',
          stats: {min: 0, max: 255} as RasterMetadataBandStats,
        },
      ],
    };

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
      rasterMetadata: rasterMetadata as RasterMetadata,
    });

    expect(features.length).toBe(16);
  });

  test('pixels - nodata', () => {
    const band_1 = {value: new Float32Array([-1, 0, NaN, 1])};

    const tile = {
      id: bigIntToHex(parent),
      index: {q: parent, i: bigIntToHex(parent)},
      zoom: 8,
      isVisible: true,
      bbox: {west, east, north, south},
      data: {
        blockSize: 2,
        cells: {properties: [], numericProps: {band_1}},
      },
    } as unknown as Tile;

    const createTileFeatures = (nodata: string | number): unknown[] =>
      tileFeatures({
        tiles: [tile],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'quadbin',
        spatialFilter: buffer(cellToBoundary(parent), 100).geometry,
        rasterMetadata: {bands: [{name: 'band_1', nodata}]} as RasterMetadata,
      }).map(({band_1}) => band_1);

    expect(createTileFeatures(-2)).toEqual([-1, 0, 1]);
    expect(createTileFeatures(-1)).toEqual([0, 1]);
    expect(createTileFeatures(0)).toEqual([-1, 1]);
    expect(createTileFeatures(1)).toEqual([-1, 0]);
    expect(createTileFeatures(NaN)).toEqual([-1, 0, 1]);

    // TODO(cleanup): Remove after API is updated to return 'nodata' as a number.
    expect(createTileFeatures('-2')).toEqual([-1, 0, 1]);
    expect(createTileFeatures('-1')).toEqual([0, 1]);
    expect(createTileFeatures('0')).toEqual([-1, 1]);
    expect(createTileFeatures('1')).toEqual([-1, 0]);
    expect(createTileFeatures('NaN')).toEqual([-1, 0, 1]);
  });
});
