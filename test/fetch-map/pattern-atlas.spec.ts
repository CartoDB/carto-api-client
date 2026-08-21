import {describe, expect, it} from 'vitest';
import {buildPatternAtlas} from '../../src/fetch-map/pattern-atlas.js';

// Canvas assembly can't run under the node test environment; every assertion here reads
// the synchronous fields of the build. The atlas Promise rejects for lack of a canvas and
// is swallowed by buildPatternAtlas.

describe('buildPatternAtlas defaults', () => {
  it('defaults to 64 @ 4 (cell 256, one 256px-dense tile) with mip depth 2', () => {
    const build = buildPatternAtlas();
    expect(build.cell).toBe(256); // size 64 × resolution 4
    expect(build.mipLevels).toBe(2);
    expect(build.scaleAdjustment).toBe(0.25); // (SOURCE_TILE_SIZE 64 × reps 1) / cell 256
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

describe('resolution raises per-tile texel density', () => {
  // reps = floor(size/64) — resolution never adds copies; every copy is rasterized at
  // cell/reps = 64 × resolution texels. Each tile keeps a constant on-screen footprint
  // of SOURCE_TILE_SIZE (64): scaleAdjustment × cell / reps === 64.
  it('keeps reps pinned to size while texels per tile grow with resolution', () => {
    for (const [resolution, cell, reps] of [
      [1, 64, 1],
      [2, 128, 1],
      [4, 256, 1],
    ] as const) {
      const b = buildPatternAtlas({size: 64, resolution});
      expect(b.cell).toBe(cell);
      expect(b.cell / reps).toBe(64 * resolution); // texels per tile
      expect((b.scaleAdjustment * b.cell) / reps).toBe(64); // on-screen footprint
    }
  });

  it('packs copies from size, each still resolution-dense', () => {
    const b = buildPatternAtlas({size: 128, resolution: 2}); // cell 256, reps 2
    expect(b.cell).toBe(256);
    expect(b.scaleAdjustment).toBe(0.5); // (64 × 2) / 256
    expect((b.scaleAdjustment * b.cell) / 2).toBe(64);
  });

  it('gives 64@2 and 128@1 the same cell but different atlases', () => {
    // Same 128px cell; one holds a single 128px-dense tile, the other 2×2 native copies.
    // A shared cache entry would silently serve one build's pixels to the other.
    const dense = buildPatternAtlas({size: 64, resolution: 2});
    const packed = buildPatternAtlas({size: 128, resolution: 1});
    expect(dense.cell).toBe(packed.cell);
    expect(dense.atlas).not.toBe(packed.atlas);
    expect(dense.scaleAdjustment).toBe(0.5);
    expect(packed.scaleAdjustment).toBe(1);
  });
});

describe('atlas mapping margin', () => {
  // pad = min(2^levels, cell/4); pitch = cell + 2*pad; frame(col,row) = (pad+col*pitch, pad+row*pitch)
  it('sizes the margin to 2^levels', () => {
    const cell = 128;
    const pad = 16; // mipLevels 4 -> min(2^4, 128/4) = min(16, 32)
    const pitch = cell + 2 * pad; // 160
    const {mapping} = buildPatternAtlas({resolution: 2, mipLevels: 4}); // svg 64 @ 2 -> cell 128

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
    const {mapping} = buildPatternAtlas({resolution: 2, mipLevels: 1}); // cell 128
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
