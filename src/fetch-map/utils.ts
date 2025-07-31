import type {BinaryFeature} from '@loaders.gl/schema';
import type {Dataset} from './types.js';
type Properties = BinaryFeature['properties'];
type NumericProps = BinaryFeature['numericProps'];

// Returns a Proxy object that allows accessing binary data
// as if it were JSON properties
export function createBinaryProxy(
  data: {numericProps: NumericProps; properties: Properties[]},
  index: number
) {
  const {properties, numericProps} = data;
  return new Proxy(properties[index] || {}, {
    get(target, property) {
      if (property in numericProps) {
        return numericProps[property as string].value[index];
      }
      return target[property as any];
    },

    has(target, property) {
      return property in numericProps || property in target;
    },

    ownKeys(target) {
      return [...Object.keys(numericProps), ...Reflect.ownKeys(target)];
    },

    getOwnPropertyDescriptor() {
      return {enumerable: true, configurable: true};
    },
  });
}

export function scaleIdentity() {
  let unknown: any;

  function scale(x: any) {
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

export function isRemoteCalculationSupported(dataset: Dataset) {
  if (dataset?.type === 'tileset' || dataset.providerId === 'databricks') {
    return false;
  }

  return true;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: '2-digit',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(value: string | number | Date): string {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatTimestamp(value: string | number | Date): string {
  return String(Math.floor(new Date(value).getTime() / 1000));
}

function roundedPow10(exp: number) {
  // Math.pow(10, less than 4) generates "0.0...009999999999999999" instead of "0.0...01"
  // round it ...
  const raw = Math.pow(10, exp);
  if (exp < 0) {
    const shift = Math.pow(10, -exp);
    return Math.round(raw * shift) / shift;
  }
  return raw;
}

/**
 * Create domain for D3 threshold scale with logarithmic steps.
 *
 * If min is 0, it starts with max and goes down to fill color scale.
 * If max is Infinity, it starts with 10 and goes up to fill color scale.
 * Othersise it starts on first power of 10 that is greater than min.
 *
 * Generates `steps-1` entries, as this is what d3 threshold scale expects
 *
 * @see https://d3js.org/d3-scale/threshold
 */
export function getLog10ScaleSteps({
  min,
  max,
  steps,
}: {
  min: number;
  max: number;
  steps: number;
}): number[] {
  if (min === 0) {
    if (max === Infinity) {
      // count aggregations have [0, Infinity]
      // that will yield [10, 100, 1000, ...]
      return [...Array(steps - 1)].map((_v, i) => roundedPow10(i + 1));
    }
    // if stats.min = 0, we only can attempt to start from max and decrease powers until
    // we use all color buckets ...
    const maxLog = Math.log10(max);
    const endExponent = Math.ceil(maxLog);
    const startExponent = endExponent - steps + 1;
    return [...Array(steps - 1)].map((_v, i) =>
      roundedPow10(startExponent + i)
    );
  } else {
    const minLog = Math.log10(min);
    const startExponent =
      Math.ceil(minLog) === minLog ? minLog + 1 : Math.ceil(minLog);

    return [...Array(steps - 1)].map((_v, i) =>
      roundedPow10(startExponent + i)
    );
  }
}
