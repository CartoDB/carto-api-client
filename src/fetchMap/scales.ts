import {
  scaleLinear,
  scaleOrdinal,
  scaleLog,
  scalePoint,
  scaleQuantile,
  scaleQuantize,
  scaleSqrt,
  scaleThreshold
} from 'd3-scale';

function scaleIdentity() {
  let unknown: any;

  function scale(x: null) {
    return x === null ? unknown : x;
  }

  scale.invert = scale;

  scale.domain = scale.range = (d: any) => d;

  scale.unknown = (u: any) => {
    if (u) {
      unknown = u;
    }

    return unknown;
  };

  scale.copy = () => {
    const scaleCopy = scaleIdentity();
    scaleCopy.unknown(unknown);
    return scaleCopy;
  };

  return scale;
}

export const SCALE_FUNCS = {
  linear: scaleLinear,
  ordinal: scaleOrdinal,
  log: scaleLog,
  point: scalePoint,
  quantile: scaleQuantile,
  quantize: scaleQuantize,
  sqrt: scaleSqrt,
  custom: scaleThreshold,
  identity: scaleIdentity
};

export type SCALE_TYPE = keyof typeof SCALE_FUNCS;