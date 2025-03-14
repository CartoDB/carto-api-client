import {BinaryFeature} from '@loaders.gl/schema';
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
