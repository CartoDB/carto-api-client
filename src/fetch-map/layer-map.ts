import {extent, groupSort} from 'd3-array';
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

export type LayerType =
  | 'clusterTile'
  | 'h3'
  | 'heatmapTile'
  | 'mvt'
  | 'quadbin'
  | 'raster'
  | 'tileset';

import {
  createBinaryProxy,
  formatDate,
  formatTimestamp,
  getLog10ScaleSteps,
  scaleIdentity,
} from './utils.js';
import type {
  ColorRange,
  CustomMarkersRange,
  Dataset,
  MapLayerConfig,
  VisConfig,
  VisualChannelField,
  VisualChannels,
} from './types.js';
import type {ProviderType, SchemaField} from '../types.js';
import {DEFAULT_AGGREGATION_EXP_ALIAS} from '../constants-internal.js';
import {AggregationTypes} from '../constants.js';
import type {Attribute, TilejsonResult} from '../sources/types.js';

export type D3Scale = {
  domain: (d?: any) => any[];
  range: (d?: any) => any[];
  unknown?: (d?: string) => any;
} & ((d: any) => any);
type D3ScaleFactory = () => D3Scale;

export type ScaleType =
  | 'linear'
  | 'ordinal'
  | 'log'
  | 'point'
  | 'quantile'
  | 'quantize'
  | 'sqrt'
  | 'custom'
  | 'identity';
const SCALE_FUNCS: Record<ScaleType, D3ScaleFactory> = {
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

function identity<T>(v: T): T {
  return v;
}

const UNKNOWN_COLOR = '#868d91';

export const OPACITY_MAP: Record<string, string> = {
  getFillColor: 'opacity',
  getLineColor: 'strokeOpacity',
  getTextColor: 'opacity',
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

const rasterPropsMap = {
  isVisible: 'visible',
  visConfig: {
    opacity: 'opacity',
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
    radius: (radius: number) => ({radiusPixels: 20 + radius}),
    opacity: 'opacity',
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

/** @privateRemarks Source: Builder */
export const TEXT_LABEL_INDEX = 0;

/** @privateRemarks Source: Builder */
export const TEXT_OUTLINE_OPACITY = 64;

export const TEXT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  notation: 'compact',
});

export function getLayerProps(
  type: LayerType,
  config: MapLayerConfig,
  dataset: Dataset
): {propMap: any; defaultProps: any} {
  if (deprecatedLayerTypes.includes(type)) {
    throw new Error(
      `Outdated layer type: ${type}. Please open map in CARTO Builder to automatically migrate.`
    );
  }

  if (type === 'raster') {
    return {
      propMap: rasterPropsMap,
      defaultProps: {},
    };
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
  attribute: Attribute,
  scaleType: ScaleType | 'log10steps',
  scaleLength: number
): number[] | string[] {
  if (
    scaleType === 'log10steps' &&
    attribute.min !== undefined &&
    attribute.max !== undefined
  ) {
    return getLog10ScaleSteps({
      min: attribute.min,
      max: attribute.max,
      steps: scaleLength,
    });
  }
  if (scaleType === 'ordinal' || scaleType === 'point') {
    if (!attribute.categories) {
      return [0, 1];
    }
    return attribute.categories
      .map((c: any) => c.category)
      .filter((c: any) => c !== undefined && c !== null);
  }

  if (scaleType === 'quantile' && attribute.quantiles) {
    return 'global' in attribute.quantiles
      ? attribute.quantiles.global[scaleLength]
      : attribute.quantiles[scaleLength];
  }

  let {min} = attribute;
  if (scaleType === 'log' && min === 0) {
    min = 1e-5;
  }
  return [min ?? 0, attribute.max ?? 1];
}

function domainFromValues(values: any, scaleType: ScaleType) {
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
  data: TilejsonResult,
  name: string,
  scaleType: ScaleType | 'log10steps',
  scaleLength?: number
) {
  if (data.tilestats) {
    // Tileset data type
    const {attributes} = data.tilestats.layers[0];
    const attribute = attributes.find((a: any) => a.attribute === name);
    if (attribute) {
      return domainFromAttribute(attribute, scaleType, scaleLength as number);
    }
  }

  return [0, 1];
}

function normalizeAccessor(accessor: any, data: any) {
  if (data.features || data.tilestats || data.raster_metadata) {
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

  // If data doesn't contain any valid keys, return all keys to run search
  // on next feature
  return keys;
}

export function getColorAccessor(
  {name, colorColumn}: VisualChannelField,
  scaleType: ScaleType,
  {aggregation, range}: {aggregation: string; range: any},
  opacity: number | undefined,
  data: TilejsonResult
): {accessor: any; scale: any} {
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
  return {accessor: normalizeAccessor(accessor, data), scale};
}

export function calculateLayerScale(
  name: string,
  scaleType: ScaleType,
  range: ColorRange,
  data: TilejsonResult
) {
  let domain: string[] | number[] = [];
  let scaleColor: string[] = [];
  const {colors} = range;

  if (scaleType === 'custom') {
    if (range.uiCustomScaleType === 'logarithmic') {
      domain = calculateDomain(data, name, 'log10steps', colors.length);
      scaleColor = colors;
    } else if (range.colorMap) {
      const {colorMap} = range;
      colorMap.forEach(([value, color]) => {
        (domain as string[]).push(value);
        scaleColor.push(color);
      });
    }
  } else if (scaleType !== 'identity') {
    domain = calculateDomain(data, name, scaleType, colors.length);
    scaleColor = colors;

    if (scaleType === 'ordinal') {
      domain = domain.slice(0, scaleColor.length);
    }
  }

  return createColorScale(scaleType, domain, scaleColor, UNKNOWN_COLOR);
}

export function createColorScale<T>(
  scaleType: ScaleType,
  domain: string[] | number[],
  range: T[],
  unknown: T
) {
  const scale = SCALE_FUNCS[scaleType]();
  scale.domain(domain);
  scale.range(range);
  scale.unknown!(unknown as any);

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

type Accessor = number | ((d: any, i: any) => number);
export function negateAccessor(accessor: Accessor): Accessor {
  if (typeof accessor === 'function') {
    return (d: any, i: any) => -accessor(d, i);
  }
  return -accessor;
}

export function getSizeAccessor(
  {name}: VisualChannelField,
  scaleType: ScaleType | undefined,
  aggregation: string | null | undefined,
  range: Iterable<Range> | null | undefined,
  data: TilejsonResult
): {accessor: any; scale: any} {
  const scale = scaleType ? SCALE_FUNCS[scaleType]() : identity;
  if (scaleType) {
    if (aggregation !== AggregationTypes.Count) {
      (scale as D3Scale).domain(calculateDomain(data, name, scaleType));
    }
    (scale as D3Scale).range(range);
  }

  let accessorKeys = getAccessorKeys(name, aggregation);
  const accessor = (properties: any) => {
    if (!(accessorKeys[0] in properties)) {
      accessorKeys = findAccessorKey(accessorKeys, properties);
    }
    const propertyValue = properties[accessorKeys[0]];
    return scale(propertyValue);
  };
  return {accessor: normalizeAccessor(accessor, data), scale};
}

const FORMATS: Record<string, (value: any) => string> = {
  date: formatDate,
  integer: d3Format('i'),
  float: d3Format('.5f'),
  timestamp: formatTimestamp,
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

/** @privateRemarks Source: Builder */
export function calculateClusterRadius(
  properties: {[column: string]: number},
  stats: Record<string, {min: number; max: number}>,
  radiusRange: [number, number],
  column: string
): number {
  const {min, max} = stats[column];
  const value = properties[column];

  // When there's a single cluster on the screen, min and max are equivalent, so we should return the maximum radius
  if (min === max) return radiusRange[1];

  const normalizedValue = (value - min) / (max - min);
  return radiusRange[0] + normalizedValue * (radiusRange[1] - radiusRange[0]);
}

/** @privateRemarks Source: Builder */
export function getDefaultAggregationExpColumnAliasForLayerType(
  layerType: LayerType,
  provider: ProviderType,
  schema: SchemaField[]
): string {
  if (schema && layerType === 'clusterTile') {
    return getColumnAliasForAggregationExp(
      getDefaultColumnFromSchemaForAggregationExp(schema),
      'count',
      provider
    );
  } else {
    return DEFAULT_AGGREGATION_EXP_ALIAS;
  }
}

/** @privateRemarks Source: Builder */
function getColumnAliasForAggregationExp(
  name: string,
  aggregation: string,
  provider: ProviderType
) {
  const columnAlias = `${name}_${aggregation}`;
  return provider === 'snowflake' ? columnAlias.toUpperCase() : columnAlias;
}

/** @privateRemarks Source: Builder */
function getDefaultColumnFromSchemaForAggregationExp(
  schema: SchemaField[]
): string {
  return schema ? schema[0].name : '';
}

/** @privateRemarks Source: Builder */
export function calculateClusterTextFontSize(radius: number): number {
  if (radius >= 80) return 24;
  if (radius >= 72) return 24;
  if (radius >= 56) return 20;
  if (radius >= 40) return 16;
  if (radius >= 24) return 13;
  if (radius >= 8) return 11;
  return 11;
}
