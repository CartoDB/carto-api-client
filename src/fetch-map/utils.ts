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
