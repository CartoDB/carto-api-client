// Client helpers for the batched-tiles fast path (server: maps-api sc-556575).
//
// deck.gl requests a viewport's tiles in one burst; per-tile serving turns that
// into N warehouse queries — ruinous on job-based engines. When the source is
// batch-capable the tilejson carries a `tiles_batch` URL; the client coalesces
// the burst into ONE request to it (`&tiles=z/x/y,z/x/y,…`, sorted so a repeated
// viewport is a repeated URL ⇒ CDN-cacheable) and splits the CDTB container the
// server returns, handing each payload to the format's normal tile decoder.
//
// These are the pure pieces (detect / build request / split response); the
// request coalescing itself lives in the deck.gl layer.

import type {TilejsonResult} from './types.js';

export interface BatchTileIndex {
  z: number;
  x: number;
  y: number;
}

/**
 * A source is batch-capable when the server advertised a `tiles_batch` endpoint
 * in the tilejson (PostgreSQL/BigQuery, binary/geojson). Absent ⇒ the consumer
 * must use the per-tile `tiles` template.
 */
export function isBatchTilesTilejson(tilejson: TilejsonResult): boolean {
  return Boolean(tilejson.tiles_batch);
}

/**
 * Build the URL for a batch of tiles: the advertised `tiles_batch` endpoint with
 * `&tiles=z/x/y,…` appended. Tiles are sorted (z, then x, then y) so the same
 * viewport always yields the same URL — batches stay as CDN-cacheable as single
 * tiles. The caller is responsible for keeping the batch within `tiles_batch_max`.
 */
export function buildBatchTilesRequest(
  tilejson: TilejsonResult,
  tiles: BatchTileIndex[]
): string {
  if (!tilejson.tiles_batch) {
    throw new Error('tilejson has no batch endpoint (tiles_batch)');
  }
  if (tiles.length === 0) {
    throw new Error('Cannot build a batch request with zero tiles');
  }
  const list = [...tiles]
    .sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y)
    .map((t) => `${t.z}/${t.x}/${t.y}`)
    .join(',');
  const separator = tilejson.tiles_batch.includes('?') ? '&' : '?';
  return `${tilejson.tiles_batch}${separator}tiles=${list}`;
}

const CDTB_MAGIC = [0x43, 0x44, 0x54, 0x42]; // "CDTB"

/** Key a tile by its `z/x/y` (matches the strings in a batch request). */
export function batchTileKey(tile: BatchTileIndex): string {
  return `${tile.z}/${tile.x}/${tile.y}`;
}

/**
 * Split the CDTB container the batch endpoint returns into per-tile payloads,
 * keyed by `z/x/y`. Each payload is the same bytes a single-tile request would
 * have returned, ready for the format's normal decoder.
 *
 * Container layout (little-endian):
 *   "CDTB" | u32 tileCount | per tile: u8 z | u32 x | u32 y | u32 len | bytes
 */
export function splitBatchTilesResponse(
  data: ArrayBuffer
): Map<string, ArrayBuffer> {
  const bytes = new Uint8Array(data);
  if (
    bytes.length < 8 ||
    bytes[0] !== CDTB_MAGIC[0] ||
    bytes[1] !== CDTB_MAGIC[1] ||
    bytes[2] !== CDTB_MAGIC[2] ||
    bytes[3] !== CDTB_MAGIC[3]
  ) {
    throw new Error('Invalid CDTB batch container');
  }
  const view = new DataView(data);
  let offset = 4;
  const tileCount = view.getUint32(offset, true);
  offset += 4;
  const tiles = new Map<string, ArrayBuffer>();
  // Each tile header is 13 bytes (u8 z + u32 x + u32 y + u32 len). Bounds-check
  // before every read and before slicing the payload so a truncated or
  // malformed container throws a clear error instead of a generic DataView
  // RangeError or a silently truncated payload.
  const TILE_HEADER_BYTES = 13;
  for (let i = 0; i < tileCount; i++) {
    if (offset + TILE_HEADER_BYTES > data.byteLength) {
      throw new Error(
        'Malformed CDTB batch container: unexpected end of metadata'
      );
    }
    const z = view.getUint8(offset);
    offset += 1;
    const x = view.getUint32(offset, true);
    offset += 4;
    const y = view.getUint32(offset, true);
    offset += 4;
    const length = view.getUint32(offset, true);
    offset += 4;
    if (offset + length > data.byteLength) {
      throw new Error(
        'Malformed CDTB batch container: unexpected end of payload'
      );
    }
    tiles.set(`${z}/${x}/${y}`, data.slice(offset, offset + length));
    offset += length;
  }
  return tiles;
}
