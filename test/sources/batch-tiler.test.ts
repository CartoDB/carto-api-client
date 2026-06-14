import {describe, test, expect} from 'vitest';
import {
  isBatchTilesTilejson,
  buildBatchTilesRequest,
  splitBatchTilesResponse,
  batchTileKey,
} from '@carto/api-client';
import type {TilejsonResult} from '@carto/api-client';

// Build a CDTB container exactly as the maps-api endpoint does, so the splitter
// is tested against the real wire layout (little-endian):
//   "CDTB" | u32 count | per tile: u8 z | u32 x | u32 y | u32 len | bytes
function makeCDTB(
  tiles: {z: number; x: number; y: number; payload: number[]}[]
): ArrayBuffer {
  let size = 8;
  for (const t of tiles) size += 13 + t.payload.length;
  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  bytes.set([0x43, 0x44, 0x54, 0x42], 0); // "CDTB"
  let off = 4;
  view.setUint32(off, tiles.length, true);
  off += 4;
  for (const t of tiles) {
    view.setUint8(off, t.z);
    off += 1;
    view.setUint32(off, t.x, true);
    off += 4;
    view.setUint32(off, t.y, true);
    off += 4;
    view.setUint32(off, t.payload.length, true);
    off += 4;
    bytes.set(t.payload, off);
    off += t.payload.length;
  }
  return buf;
}

const batchTilejson = {
  tiles: ['https://x/{z}/{x}/{y}?name=t&formatTiles=binary'],
  tiles_batch:
    'https://x/table/tiles?name=t&geomType=points&formatTiles=binary',
  tiles_batch_max: 32,
} as unknown as TilejsonResult;

describe('batch-tiler', () => {
  describe('isBatchTilesTilejson', () => {
    test('true when tiles_batch is advertised', () => {
      expect(isBatchTilesTilejson(batchTilejson)).toBe(true);
    });
    test('false when absent', () => {
      expect(
        isBatchTilesTilejson({
          tiles: ['https://x/{z}/{x}/{y}'],
        } as unknown as TilejsonResult)
      ).toBe(false);
    });
  });

  describe('buildBatchTilesRequest', () => {
    test('sorts tiles (z,x,y) and appends &tiles=', () => {
      const url = buildBatchTilesRequest(batchTilejson, [
        {z: 10, x: 5, y: 9},
        {z: 8, x: 1, y: 1},
        {z: 10, x: 5, y: 1},
        {z: 10, x: 2, y: 0},
      ]);
      expect(url).toBe(
        'https://x/table/tiles?name=t&geomType=points&formatTiles=binary&tiles=8/1/1,10/2/0,10/5/1,10/5/9'
      );
    });
    test('a repeated viewport (any order) yields the same URL', () => {
      const a = buildBatchTilesRequest(batchTilejson, [
        {z: 1, x: 0, y: 0},
        {z: 1, x: 1, y: 0},
      ]);
      const b = buildBatchTilesRequest(batchTilejson, [
        {z: 1, x: 1, y: 0},
        {z: 1, x: 0, y: 0},
      ]);
      expect(a).toEqual(b);
    });
    test('throws when the source is not batch-capable', () => {
      expect(() =>
        buildBatchTilesRequest({tiles: []} as unknown as TilejsonResult, [
          {z: 0, x: 0, y: 0},
        ])
      ).toThrow(/tiles_batch/);
    });
    test('throws when given zero tiles', () => {
      expect(() => buildBatchTilesRequest(batchTilejson, [])).toThrow(
        /zero tiles/
      );
    });
  });

  describe('splitBatchTilesResponse', () => {
    test('splits the CDTB container into per-tile payloads keyed by z/x/y', () => {
      const buffer = makeCDTB([
        {z: 0, x: 0, y: 0, payload: [1, 2, 3]},
        {z: 10, x: 523, y: 350, payload: [9, 8, 7, 6]},
      ]);
      const tiles = splitBatchTilesResponse(buffer);
      expect([...tiles.keys()]).toEqual(['0/0/0', '10/523/350']);
      expect([...new Uint8Array(tiles.get('0/0/0'))]).toEqual([1, 2, 3]);
      expect([
        ...new Uint8Array(tiles.get(batchTileKey({z: 10, x: 523, y: 350}))),
      ]).toEqual([9, 8, 7, 6]);
    });
    test('handles an empty (zero-payload) tile', () => {
      const tiles = splitBatchTilesResponse(
        makeCDTB([{z: 5, x: 1, y: 1, payload: []}])
      );
      expect(tiles.get('5/1/1').byteLength).toEqual(0);
    });
    test('throws on a non-CDTB buffer', () => {
      const bad = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0, 0, 0, 0]).buffer;
      expect(() => splitBatchTilesResponse(bad)).toThrow(/CDTB/);
    });
    test('throws on a truncated tile header', () => {
      // Valid container, then cut mid-header (count says 1 tile, header is 13B
      // starting at offset 8 — slice to 15 leaves only 7 of the 13).
      const truncated = makeCDTB([
        {z: 0, x: 0, y: 0, payload: [1, 2, 3]},
      ]).slice(0, 15);
      expect(() => splitBatchTilesResponse(truncated)).toThrow(
        /unexpected end of metadata/
      );
    });
    test('throws on a truncated payload', () => {
      // Full header (through offset 21) but the 3-byte payload is cut off.
      const truncated = makeCDTB([
        {z: 0, x: 0, y: 0, payload: [1, 2, 3]},
      ]).slice(0, 22);
      expect(() => splitBatchTilesResponse(truncated)).toThrow(
        /unexpected end of payload/
      );
    });
  });
});
