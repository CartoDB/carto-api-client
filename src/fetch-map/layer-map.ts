import {deviation, extent, groupSort, median, variance} from 'd3-array';
import {rgb} from 'd3-color';
import {
  scaleLinear,
  scaleOrdinal,
  scaleLog,
  scalePoint,
  scaleQuantile,
  scaleQuantize,
  scaleSqrt,
  scaleThreshold,
} from 'd3-scale';
import {format as d3Format} from 'd3-format';
import moment from 'moment-timezone';

import type {
  Accessor,
  Layer,
  _ConstructorOf as ConstructorOf,
} from '@deck.gl/core';

export type LayerType =
  | 'clusterTile'
  | 'h3'
  | 'heatmapTile'
  | 'mvt'
  | 'quadbin'
  | 'raster'
  | 'tileset';

export type LayerProvider = Record<LayerType, ConstructorOf<Layer>>;

import {createBinaryProxy, scaleIdentity} from './utils.js';
import {
  CustomMarkersRange,
  MapDataset,
  MapTextSubLayerConfig,
  VisConfig,
  VisualChannelField,
  VisualChannels,
} from './types.js';

const SCALE_FUNCS: Record<string, () => any> = {
  linear: scaleLinear,
  ordinal: scaleOrdinal,
  log: scaleLog,
  point: scalePoint,
  quantile: scaleQuantile,
  quantize: scaleQuantize,
  sqrt: scaleSqrt,
  custom: scaleThreshold,
  identity: scaleIdentity,
};
export type SCALE_TYPE = keyof typeof SCALE_FUNCS;

function identity<T>(v: T): T {
  return v;
}

const UNKNOWN_COLOR = '#868d91';

export const AGGREGATION: Record<string, string> = {
  average: 'MEAN',
  maximum: 'MAX',
  minimum: 'MIN',
  sum: 'SUM',
};

export const OPACITY_MAP: Record<string, string> = {
  getFillColor: 'opacity',
  getLineColor: 'strokeOpacity',
  getTextColor: 'opacity',
};

const AGGREGATION_FUNC: Record<string, (values: any, accessor: any) => any> = {
  'count unique': (values: any, accessor: any) =>
    groupSort(values, (v) => v.length, accessor).length,
  median,
  // Unfortunately mode() is only available in d3-array@3+ which is ESM only
  mode: (values: any, accessor: any) =>
    groupSort(values, (v) => v.length, accessor).pop(),
  stddev: deviation,
  variance,
};

const hexToRGBA = (c: any) => {
  const {r, g, b, opacity} = rgb(c);
  return [r, g, b, 255 * opacity];
};

// Kepler prop value -> Deck.gl prop value
// Supports nested definitions, and function transforms:
//   {keplerProp: 'deckProp'} is equivalent to:
//   {keplerProp: x => ({deckProp: x})}
const sharedPropMap = {
  // Apply the value of Kepler `color` prop to the deck `getFillColor` prop
  color: 'getFillColor',
  isVisible: 'visible',
  label: 'cartoLabel',
  textLabel: {
    alignment: 'getTextAlignmentBaseline',
    anchor: 'getTextAnchor',
    // Apply the value of Kepler `textLabel.color` prop to the deck `getTextColor` prop
    color: 'getTextColor',
    size: 'getTextSize',
  },
  visConfig: {
    enable3d: 'extruded',
    elevationScale: 'elevationScale',
    filled: 'filled',
    strokeColor: 'getLineColor',
    stroked: 'stroked',
    thickness: 'getLineWidth',
    radius: 'getPointRadius',
    wireframe: 'wireframe',
  },
};

const customMarkersPropsMap = {
  color: 'getIconColor',
  visConfig: {
    radius: 'getIconSize',
  },
};

const heatmapTilePropsMap = {
  visConfig: {
    colorRange: (x: any) => ({colorRange: x.colors.map(hexToRGBA)}),
    radius: 'radiusPixels',
  },
};

const defaultProps = {
  lineMiterLimit: 2,
  lineWidthUnits: 'pixels',
  pointRadiusUnits: 'pixels',
  rounded: true,
  wrapLongitude: false,
};

function mergePropMaps(
  a: Record<string, any> = {},
  b: Record<string, any> = {}
) {
  return {...a, ...b, visConfig: {...a.visConfig, ...b.visConfig}};
}

const deprecatedLayerTypes = [
  'geojson',
  'grid',
  'heatmap',
  'hexagon',
  'hexagonId',
  'point',
];

export function getLayer(
  type: LayerType,
  config: MapTextSubLayerConfig,
  dataset: MapDataset,
  layerProvider: LayerProvider
): {Layer: ConstructorOf<Layer>; propMap: any; defaultProps: any} {
  if (deprecatedLayerTypes.includes(type)) {
    throw new Error(
      `Outdated layer type: ${type}. Please open map in CARTO Builder to automatically migrate.`
    );
  }
  if (!layerProvider[type]) {
    throw new Error(`No layer provided for type: ${type} in layerProvider`);
  }

  let basePropMap: any = sharedPropMap;
  if (config.visConfig?.customMarkers) {
    basePropMap = mergePropMaps(basePropMap, customMarkersPropsMap);
  }
  if (type === 'heatmapTile') {
    basePropMap = mergePropMaps(basePropMap, heatmapTilePropsMap);
  }
  const {aggregationExp, aggregationResLevel} = dataset;

  return {
    Layer: layerProvider[type],
    propMap: basePropMap,
    defaultProps: {
      ...defaultProps,
      ...(aggregationExp && {aggregationExp}),
      ...(aggregationResLevel && {aggregationResLevel}),
      uniqueIdProperty: 'geoid',
    },
  };
}

function domainFromAttribute(
  attribute: any,
  scaleType: SCALE_TYPE,
  scaleLength: number
) {
  if (scaleType === 'ordinal' || scaleType === 'point') {
    return attribute.categories
      .map((c: any) => c.category)
      .filter((c: any) => c !== undefined && c !== null);
  }

  if (scaleType === 'quantile' && attribute.quantiles) {
    return attribute.quantiles.global
      ? attribute.quantiles.global[scaleLength]
      : attribute.quantiles[scaleLength];
  }

  let {min} = attribute;
  if (scaleType === 'log' && min === 0) {
    min = 1e-5;
  }
  return [min, attribute.max];
}

function domainFromValues(values: any, scaleType: SCALE_TYPE) {
  if (scaleType === 'ordinal' || scaleType === 'point') {
    return groupSort(
      values,
      (g) => -g.length,
      (d) => d
    );
  } else if (scaleType === 'quantile') {
    return values.sort((a: any, b: any) => a - b);
  } else if (scaleType === 'log') {
    const [d0, d1] = extent(values as number[]);
    return [d0 === 0 ? 1e-5 : d0, d1];
  }
  return extent(values);
}

function calculateDomain(
  data: any,
  name: any,
  scaleType: SCALE_TYPE,
  scaleLength?: number
) {
  if (data.tilestats) {
    // Tileset data type
    const {attributes} = data.tilestats.layers[0];
    const attribute = attributes.find((a: any) => a.attribute === name);
    return domainFromAttribute(attribute, scaleType, scaleLength as number);
  }

  return [0, 1];
}

function normalizeAccessor(accessor: any, data: any) {
  if (data.features || data.tilestats) {
    return (object: any, info: any) => {
      if (object) {
        return accessor(object.properties || object.__source.object.properties);
      }

      const {data, index} = info;
      const proxy = createBinaryProxy(data, index);
      return accessor(proxy);
    };
  }
  return accessor;
}

export function opacityToAlpha(opacity?: number) {
  return opacity !== undefined
    ? Math.round(255 * Math.pow(opacity, 1 / 2.2))
    : 255;
}

function getAccessorKeys(name: string, aggregation?: string | null): string[] {
  let keys = [name];
  if (aggregation) {
    // Snowflake will capitalized the keys, need to check lower and upper case version
    keys = keys.concat(
      [aggregation, aggregation.toUpperCase()].map((a) => `${name}_${a}`)
    );
  }
  return keys;
}

function findAccessorKey(keys: string[], properties: any): string[] {
  for (const key of keys) {
    if (key in properties) {
      return [key];
    }
  }

  throw new Error(
    `Could not find property for any accessor key: ${keys.join(', ')}`
  );
}

export function getColorValueAccessor(
  {name}: VisualChannelField,
  colorAggregation: string,
  data: any
) {
  const aggregator = AGGREGATION_FUNC[colorAggregation];
  const accessor = (values: any) => aggregator(values, (p: any) => p[name]);
  return normalizeAccessor(accessor, data);
}

export function getColorAccessor(
  {name, colorColumn}: VisualChannelField,
  scaleType: SCALE_TYPE,
  {aggregation, range}: {aggregation: string; range: any},
  opacity: number | undefined,
  data: any
) {
  const scale = calculateLayerScale(
    colorColumn || name,
    scaleType,
    range,
    data
  );
  const alpha = opacityToAlpha(opacity);

  let accessorKeys = getAccessorKeys(name, aggregation);
  const accessor = (properties: any) => {
    if (!(accessorKeys[0] in properties)) {
      accessorKeys = findAccessorKey(accessorKeys, properties);
    }
    const propertyValue = properties[accessorKeys[0]];
    const {r, g, b} = rgb(scale(propertyValue));
    return [r, g, b, propertyValue === null ? 0 : alpha];
  };
  return normalizeAccessor(accessor, data);
}

function calculateLayerScale(
  name: any,
  scaleType: SCALE_TYPE,
  range: any,
  data: any
) {
  const scale = SCALE_FUNCS[scaleType]();
  let domain: (string | number)[] = [];
  let scaleColor: string[] = [];

  if (scaleType !== 'identity') {
    const {colorMap, colors} = range;

    if (Array.isArray(colorMap)) {
      colorMap.forEach(([value, color]) => {
        domain.push(value);
        scaleColor.push(color);
      });
    } else {
      domain = calculateDomain(data, name, scaleType, colors.length);
      scaleColor = colors;
    }

    if (scaleType === 'ordinal') {
      domain = domain.slice(0, scaleColor.length);
    }
  }

  scale.domain(domain);
  scale.range(scaleColor);
  scale.unknown(UNKNOWN_COLOR);

  return scale;
}

const FALLBACK_ICON =
  'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiLz4NCjwvc3ZnPg==';

export function getIconUrlAccessor(
  field: VisualChannelField | null | undefined,
  range: CustomMarkersRange | null | undefined,
  {
    fallbackUrl,
    maxIconSize,
    useMaskedIcons,
  }: {
    fallbackUrl?: string | null;
    maxIconSize: number;
    useMaskedIcons?: boolean;
  },
  data: any
) {
  const urlToUnpackedIcon = (url: string) => ({
    id: `${url}@@${maxIconSize}`,
    url,
    width: maxIconSize,
    height: maxIconSize,
    mask: useMaskedIcons,
  });
  let unknownValue = fallbackUrl || FALLBACK_ICON;

  if (range?.othersMarker) {
    unknownValue = range.othersMarker;
  }

  const unknownIcon = urlToUnpackedIcon(unknownValue);
  if (!range || !field) {
    return () => unknownIcon;
  }

  const mapping: Record<string, any> = {};
  for (const {value, markerUrl} of range.markerMap) {
    if (markerUrl) {
      mapping[value] = urlToUnpackedIcon(markerUrl);
    }
  }

  const accessor = (properties: any) => {
    const propertyValue = properties[field.name];
    return mapping[propertyValue] || unknownIcon;
  };
  return normalizeAccessor(accessor, data);
}

export function getMaxMarkerSize(
  visConfig: VisConfig,
  visualChannels: VisualChannels
): number {
  const {radiusRange, radius} = visConfig;
  const {radiusField, sizeField} = visualChannels;
  const field = radiusField || sizeField;
  return Math.ceil(radiusRange && field ? radiusRange[1] : radius);
}

export function negateAccessor<T>(
  accessor: Accessor<T, number>
): Accessor<T, number> {
  return typeof accessor === 'function' ? (d, i) => -accessor(d, i) : -accessor;
}

export function getSizeAccessor(
  {name}: VisualChannelField,
  scaleType: SCALE_TYPE | undefined,
  aggregation: string | null | undefined,
  range: Iterable<Range> | null | undefined,
  data: any
) {
  const scale = scaleType ? SCALE_FUNCS[scaleType as any]() : identity;
  if (scaleType) {
    if (aggregation !== 'count') {
      scale.domain(calculateDomain(data, name, scaleType));
    }
    scale.range(range);
  }

  let accessorKeys = getAccessorKeys(name, aggregation);
  const accessor = (properties: any) => {
    if (!(accessorKeys[0] in properties)) {
      accessorKeys = findAccessorKey(accessorKeys, properties);
    }
    const propertyValue = properties[accessorKeys[0]];
    return scale(propertyValue);
  };
  return normalizeAccessor(accessor, data);
}

const FORMATS: Record<string, (value: any) => string> = {
  date: (s) => moment.utc(s).format('MM/DD/YY HH:mm:ssa'),
  integer: d3Format('i'),
  float: d3Format('.5f'),
  timestamp: (s) => moment.utc(s).format('X'),
  default: String,
};

export function getTextAccessor({name, type}: VisualChannelField, data: any) {
  const format = FORMATS[type] || FORMATS.default;
  const accessor = (properties: any) => {
    return format(properties[name]);
  };
  return normalizeAccessor(accessor, data);
}

export {domainFromValues as _domainFromValues};
