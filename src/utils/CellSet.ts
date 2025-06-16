/** Flags 'empty' values in a Uint32Array index. */
const EMPTY_U32 = 2 ** 32 - 1;

/**
 * Custom Set-like interface optimized for BigUint64 cell IDs. Unlike Set,
 * limited in most JavaScript runtimes to ~16M entries, this implementation
 * can support up to `n = 2^32 - 1` (4 billion) entries, with lookups in
 * amortized O(1) time.
 */
export class CellSet {
  /** List of cells stored by the set. Stored by reference, without copying. */
  private cells: bigint[];

  /** DataView representing a single cell ID. Pre-allocated to reduce memory during queries. */
  private cellView = new DataView(new ArrayBuffer(8));

  /** Hash table, mapping a hash index (computed) to an index in the 'cells' array. */
  private hashTable: Uint32Array;

  constructor(cells: bigint[]) {
    this.cells = cells;

    // Pre-allocate hash table for queries.
    this.hashTable = new Uint32Array(hashBuckets(cells.length)).fill(EMPTY_U32);
    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      this.hashTable[this.hashLookup(cells[cellIndex])] = cellIndex;
    }
  }

  has(cell: bigint): boolean {
    const hashIndex = this.hashLookup(cell);
    return this.hashTable[hashIndex] !== EMPTY_U32;
  }

  private hashLookup(cell: bigint): number {
    // Hash implementation operates on 32-bit chunks, so write the cell ID
    // into a pre-allocated DataView for easier iteration.
    this.cellView.setBigUint64(0, cell);
    const hashval = hash(this.cellView);
    const hashmod = this.hashTable.length - 1;
    let bucket = hashval & hashmod;

    // Find the first bucket in the hash table where either (a) no cell
    // is yet stored, or (b) the stored cell and the query cell are equal.
    for (let probe = 0; probe <= hashmod; probe++) {
      const cellIndex = this.hashTable[bucket];

      if (cellIndex === EMPTY_U32 || cell === this.cells[cellIndex]) {
        return bucket;
      }

      bucket = (bucket + probe + 1) & hashmod; // Hash collision; quadratic probing.
    }

    throw new Error('Hash table full.'); // Unreachable.
  }
}

/**
 * MurmurHash2
 *
 * References:
 * - https://github.com/mikolalysenko/murmurhash-js/blob/f19136e9f9c17f8cddc216ca3d44ec7c5c502f60/murmurhash2_gc.js#L14
 * - https://github.com/zeux/meshoptimizer/blob/e47e1be6d3d9513153188216455bdbed40a206ef/src/indexgenerator.cpp#L12
 */
function hash(view: DataView, h = 0): number {
  const m = 0x5bd1e995;
  const r = 24;

  for (let i = 0, il = view.byteLength / 4; i < il; i++) {
    let k = view.getUint32(i * 4);

    k = Math.imul(k, m) >>> 0;
    k = (k ^ (k >> r)) >>> 0;
    k = Math.imul(k, m) >>> 0;

    h = Math.imul(h, m) >>> 0;
    h = (h ^ k) >>> 0;
  }

  return h;
}

function hashBuckets(initialCount: number) {
  let buckets = 1;
  while (buckets < initialCount + initialCount / 4) {
    buckets *= 2;
  }
  return buckets;
}
