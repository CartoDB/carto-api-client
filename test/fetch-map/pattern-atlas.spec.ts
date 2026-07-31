import {describe, expect, it} from 'vitest';
import {buildPatternAtlas} from '../../src/fetch-map/pattern-atlas.js';

// Canvas assembly can't run under the node test environment; every assertion here reads
// the synchronous fields of the build. The atlas Promise rejects for lack of a canvas and
// is swallowed by buildPatternAtlas.

describe('buildPatternAtlas defaults', () => {
  it('defaults to 64 @ 2 (cell 128, 2×2 packing) with mip depth 2', () => {
    const build = buildPatternAtlas();
    expect(build.cell).toBe(128); // size 64 × resolution 2
    expect(build.mipLevels).toBe(2);
    expect(build.scaleAdjustment).toBe(1); // (SOURCE_TILE_SIZE 64 × reps 2) / cell 128
  });

  it('floors mipLevels and ignores a negative value', () => {
    expect(buildPatternAtlas({mipLevels: 3.9}).mipLevels).toBe(3);
    expect(buildPatternAtlas({mipLevels: -1}).mipLevels).toBe(2);
  });

  it('emits mips-on + anisotropy sampler defaults', () => {
    expect(buildPatternAtlas().textureParameters).toEqual({
      lodMaxClamp: 2,
      maxAnisotropy: 4,
    });
  });

  it('keeps lodMaxClamp equal to the atlas mip depth', () => {
    // The gutter is sized to the same depth, so the sampler never bleeds across cells.
    expect(
      buildPatternAtlas({mipLevels: 1}).textureParameters.lodMaxClamp
    ).toBe(1);
    expect(
      buildPatternAtlas({mipLevels: 4}).textureParameters.lodMaxClamp
    ).toBe(4);
  });
});

describe('resolution packs more native-size tiles', () => {
  // The atlas packs floor(cell/64) copies per cell. Each packed tile keeps a constant
  // on-screen footprint of SOURCE_TILE_SIZE (64): scaleAdjustment × cell / reps === 64.
  // Resolution raises the atlas texel budget (more copies), not per-tile density.
  it('grows cell and reps with resolution, per-tile footprint constant', () => {
    for (const [resolution, cell, reps] of [
      [1, 64, 1],
      [2, 128, 2],
      [4, 256, 4],
    ] as const) {
      const b = buildPatternAtlas({size: 64, resolution});
      expect(b.cell).toBe(cell);
      expect((b.scaleAdjustment * b.cell) / reps).toBe(64);
    }
  });

  it('sets scaleAdjustment to (64 × reps) / cell', () => {
    expect(buildPatternAtlas({size: 64, resolution: 2}).scaleAdjustment).toBe(
      1
    );
    // cell 256, reps 4 -> (64 × 4) / 256 = 1
    expect(buildPatternAtlas({size: 128, resolution: 2}).scaleAdjustment).toBe(
      1
    );
  });
});

describe('atlas mapping margin', () => {
  // pad = min(2^levels, cell/4); pitch = cell + 2*pad; frame(col,row) = (pad+col*pitch, pad+row*pitch)
  it('sizes the margin to 2^levels', () => {
    const cell = 128;
    const pad = 16; // mipLevels 4 -> min(2^4, 128/4) = min(16, 32)
    const pitch = cell + 2 * pad; // 160
    const {mapping} = buildPatternAtlas({mipLevels: 4}); // svg 64 @ 2 -> cell 128

    expect(mapping['hlines-large']).toMatchObject({
      x: pad,
      y: pad,
      width: cell,
    });
    expect(mapping['hlines-medium'].x).toBe(pad + pitch);
    expect(mapping['vlines-large'].y).toBe(pad + pitch);
    expect(mapping.solid).toMatchObject({x: pad + pitch, y: pad + 7 * pitch});
  });

  it('shrinks the margin when fewer mip levels are requested', () => {
    const pad = 2; // min(2^1, 32)
    const {mapping} = buildPatternAtlas({mipLevels: 1}); // cell 128
    expect(mapping['hlines-large']).toMatchObject({x: pad, y: pad});
  });

  it('caps the margin at cell/4 for small cells', () => {
    const pad = 8; // cell 32 -> min(2^4=16, 32/4=8)
    const {mapping} = buildPatternAtlas({
      size: 16,
      resolution: 2,
      mipLevels: 4,
    }); // cell 32
    expect(mapping['hlines-large']).toMatchObject({x: pad, y: pad});
  });
});
