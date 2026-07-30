import {afterEach, describe, expect, it} from 'vitest';
import {
  getPatternAtlasMapping,
  getPatternMipLevels,
} from '../../src/fetch-map/pattern-atlas.js';

type Knobs = {
  __CARTO_PATTERN_MIP_LEVELS__?: number;
  __CARTO_PATTERN_CELL_SIZE__?: number;
};

const knobs = globalThis as Knobs;

afterEach(() => {
  delete knobs.__CARTO_PATTERN_MIP_LEVELS__;
  delete knobs.__CARTO_PATTERN_CELL_SIZE__;
});

describe('getPatternMipLevels', () => {
  it('defaults to 4', () => {
    expect(getPatternMipLevels()).toBe(4);
  });

  it('honours the debug knob and floors it', () => {
    knobs.__CARTO_PATTERN_MIP_LEVELS__ = 2.9;
    expect(getPatternMipLevels()).toBe(2);
  });

  it('ignores a negative knob', () => {
    knobs.__CARTO_PATTERN_MIP_LEVELS__ = -1;
    expect(getPatternMipLevels()).toBe(4);
  });
});

describe('getPatternAtlasMapping margin', () => {
  // pad = min(2^levels, cell/4); pitch = cell + 2*pad; frame(col,row) = (pad+col*pitch, pad+row*pitch)
  it('sizes the margin to 2^levels at the default cell', () => {
    const cell = 128;
    const pad = 16; // min(2^4, 128/4) = min(16, 32)
    const pitch = cell + 2 * pad; // 160
    const mapping = getPatternAtlasMapping(cell);

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
    knobs.__CARTO_PATTERN_MIP_LEVELS__ = 1;
    const cell = 128;
    const pad = 2; // min(2^1, 32)
    expect(getPatternAtlasMapping(cell)['hlines-large']).toMatchObject({
      x: pad,
      y: pad,
    });
  });

  it('caps the margin at cell/4 for small cells', () => {
    const cell = 32; // min(2^4=16, 32/4=8) -> 8
    const pad = 8;
    expect(getPatternAtlasMapping(cell)['hlines-large']).toMatchObject({
      x: pad,
      y: pad,
    });
  });
});
