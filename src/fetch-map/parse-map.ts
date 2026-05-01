import type {ColorParameters} from '@luma.gl/core';
import {
  calculateClusterRadius,
  calculateClusterTextFontSize,
  compileCustomAggregation,
  getDefaultAggregationExpColumnAliasForLayerType,
  getLayerProps,
  getColorAccessor,
  getSizeAccessor,
  getTextAccessor,
  opacityToAlpha,
  getIconUrlAccessor,
  negateAccessor,
  getMaxMarkerSize,
  type LayerType,
  OPACITY_MAP,
  TEXT_NUMBER_FORMATTER,
  TEXT_LABEL_INDEX,
  TEXT_OUTLINE_OPACITY,
  type ScaleType,
} from './layer-map.js';

import {assert, isEmptyObject} from '../utils.js';
import type {Filters} from '../types.js';
import type {
  KeplerMapConfig,
  MapLayerConfig,
  VisualChannels,
  VisConfig,
  MapConfigLayer,
  Dataset,
  VisualChannelField,
} from './types.js';
import {isRemoteCalculationSupported} from './utils.js';
import {
  getRasterTileLayerStylePropsRgb,
  getRasterTileLayerStylePropsScaledBand,
} from './raster-layer.js';
import type {ProviderType} from '../types.js';
import type {TilejsonResult} from '../sources/types.js';

export type Scale = {
  type: ScaleType;
  field?: VisualChannelField;

  /** Natural domain of the scale, as defined by the data  */
  domain?: string[] | number[];

  /** Domain of the user to construct d3 scale */
  scaleDomain?: string[] | number[];
  range?: string[] | number[];
};

export type ScaleKey =
  | 'fillColor'
  | 'pointRadius'
  | 'lineColor'
  | 'lineWidth'
  | 'elevation'
  | 'weight';

export type Scales = Partial<Record<ScaleKey, Scale>>;

export type LayerDescriptor = {
  type: LayerType;
  props: Record<string, any>;
  filters?: Filters;
  scales: Scales;
};

export type ParseMapResult = {
  /** Map id. */
  id: string;

  /** Title of map. */
  title: string;

  /** Description of map. */
  description?: string;
  createdAt: string;
  updatedAt: string;
  initialViewState: any;

  /** @deprecated Use `basemap`. */
  mapStyle: any;
  popupSettings: any;
  token: string;

  layers: LayerDescriptor[];
};

export function getLayerDescriptor({
  mapConfig,
  layer,
  dataset,
}: {
  mapConfig: KeplerMapConfig;
  layer: MapConfigLayer;
  dataset: Dataset;
}) {
  const {filters, visState} = mapConfig;
  const {layerBlending, interactionConfig} = visState;
  const {id, type, config, visualChannels} = layer;
  const {data, id: datasetId} = dataset;

  const {propMap, defaultProps} = getLayerProps(type, config, dataset);

  const styleProps = createStyleProps(config, propMap);

  const {channelProps, scales} = createChannelProps(
    id,
    type,
    config,
    visualChannels,
    data,
    dataset
  );
  const layerDescriptor: LayerDescriptor = {
    type,
    filters:
      isEmptyObject(filters) || isRemoteCalculationSupported(dataset)
        ? undefined
        : filters[datasetId],
    props: {
      id,
      data,
      ...defaultProps,
      ...createInteractionProps(interactionConfig),
      ...styleProps,
      ...channelProps,
      ...createZoomScaleProps(config, visualChannels),
      ...createParametersProp(layerBlending, styleProps.parameters || {}), // Must come after style
      ...createLoadOptions(data.accessToken),
    },
    scales,
  };
  return layerDescriptor;
}

export function parseMap(json: any) {
  const {keplerMapConfig, datasets, token} = json;
  assert(keplerMapConfig.version === 'v1', 'Only support Kepler v1');
  const mapConfig = keplerMapConfig.config as KeplerMapConfig;
  const {mapState, mapStyle, popupSettings, legendSettings, visState} =
    mapConfig;
  const {layers} = visState;

  const layersReverse = [...layers].reverse();
  return {
    id: json.id,
    title: json.title,
    description: json.description,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    initialViewState: mapState,
    /** @deprecated Use `basemap`. */
    mapStyle,
    popupSettings,
    legendSettings,
    token,
    layers: layersReverse.map((layer: MapConfigLayer) => {
      try {
        const {dataId} = layer.config;
        const dataset: Dataset | null = datasets.find(
          (d: any) => d.id === dataId
        );
        assert(dataset, `No dataset matching dataId: ${dataId}`);
        const layerDescriptor = getLayerDescriptor({
          mapConfig,
          layer,
          dataset,
        });
        return layerDescriptor;
      } catch (e: any) {
        console.error(e.message);
        return undefined;
      }
    }),
  };
}

function createParametersProp(
  layerBlending: string,
  parameters: ColorParameters
) {
  if (layerBlending === 'additive') {
    parameters.blendColorSrcFactor = parameters.blendAlphaSrcFactor =
      'src-alpha';
    parameters.blendColorDstFactor = parameters.blendAlphaDstFactor =
      'dst-alpha';
    parameters.blendColorOperation = parameters.blendAlphaOperation = 'add';
  } else if (layerBlending === 'subtractive') {
    parameters.blendColorSrcFactor = 'one';
    parameters.blendColorDstFactor = 'one-minus-dst-color';
    parameters.blendAlphaSrcFactor = 'src-alpha';
    parameters.blendAlphaDstFactor = 'dst-alpha';
    parameters.blendColorOperation = 'subtract';
    parameters.blendAlphaOperation = 'add';
  }

  return Object.keys(parameters).length ? {parameters} : {};
}

function createInteractionProps(interactionConfig: any) {
  const pickable = interactionConfig && interactionConfig.tooltip.enabled;
  return {
    autoHighlight: pickable,
    pickable,
  };
}

function createZoomScaleProps(
  config: MapLayerConfig,
  visualChannels: VisualChannels
): Record<string, any> {
  const {visConfig} = config;
  if (
    !visConfig.radiusScaleWithZoom ||
    visualChannels.radiusField ||
    visualChannels.sizeField
  ) {
    return {};
  }
  // When `radiusScaleWithZoom` is enabled, render the point in `common`
  // coordinate space so it scales proportionally with zoom.
  const referenceZoom = visConfig.radiusReferenceZoom ?? 12;
  const scale = Math.pow(2, -referenceZoom);
  const result: Record<string, any> = {
    pointRadiusUnits: 'common',
    pointRadiusScale: scale,
    iconSizeUnits: 'common',
    iconSizeScale: scale,
  };
  if (visConfig.sizeMinPixels !== undefined) {
    result.pointRadiusMinPixels = visConfig.sizeMinPixels;
    result.iconSizeMinPixels = visConfig.sizeMinPixels;
  }
  if (visConfig.sizeMaxPixels !== undefined) {
    result.pointRadiusMaxPixels = visConfig.sizeMaxPixels;
    result.iconSizeMaxPixels = visConfig.sizeMaxPixels;
  }
  return result;
}

function mapProps(source: any, target: any, mapping: any) {
  for (const sourceKey in mapping) {
    const sourceValue = source[sourceKey];
    const targetKey = mapping[sourceKey];
    if (sourceValue === undefined) {
      continue;
    }
    if (typeof targetKey === 'string') {
      target[targetKey] = sourceValue;
    } else if (typeof targetKey === 'function') {
      const [key, value] = Object.entries(targetKey(sourceValue))[0];
      target[key] = value;
    } else if (typeof targetKey === 'object') {
      // Nested definition, recurse down one level (also handles arrays)
      mapProps(sourceValue, target, targetKey);
    }
  }
}

function createStyleProps(config: MapLayerConfig, mapping: any) {
  const result: Record<string, any> = {};
  mapProps(config, result, mapping);

  // Kepler format sometimes omits strokeColor. TODO: remove once we can rely on
  // `strokeColor` always being set when `stroke: true`.
  if (result.stroked && !result.getLineColor) {
    result.getLineColor = result.getFillColor;
  }

  for (const colorAccessor in OPACITY_MAP) {
    if (Array.isArray(result[colorAccessor])) {
      const color = [...result[colorAccessor]];
      const opacityKey = OPACITY_MAP[colorAccessor];
      const opacity = config.visConfig[opacityKey as keyof VisConfig] as number;
      color[3] = opacityToAlpha(opacity);
      result[colorAccessor] = color;
    }
  }

  result.highlightColor = config.visConfig.enable3d
    ? [255, 255, 255, 60]
    : [252, 242, 26, 255];
  return result;
}

function resolveCustomAggregation({
  field,
  aggregation,
  expression,
  domain,
  providerId,
}: {
  field: VisualChannelField | undefined;
  aggregation: string | undefined;
  expression: string | undefined;
  domain: [number, number] | undefined;
  providerId: ProviderType;
}): {
  field: VisualChannelField | undefined;
  aggregation: string | undefined;
  domainOverride: [number, number] | undefined;
} {
  if (aggregation !== 'custom') {
    return {field, aggregation, domainOverride: undefined};
  }
  if (!field || !expression?.trim()) {
    return {field, aggregation: undefined, domainOverride: undefined};
  }
  const alias = compileCustomAggregation(expression, {provider: providerId});
  return {
    field: {...field, accessorKey: alias},
    aggregation: undefined,
    domainOverride: domain,
  };
}

function createChannelProps(
  id: string,
  layerType: LayerType,
  config: MapLayerConfig,
  visualChannels: VisualChannels,
  data: TilejsonResult,
  dataset: Dataset
): {
  channelProps: Record<string, any>;
  scales: Partial<Record<ScaleKey, Scale>>;
} {
  if (layerType === 'raster') {
    const rasterMetadata = data.raster_metadata;
    if (!rasterMetadata) {
      return {
        channelProps: {},
        scales: {},
      };
    }
    const rasterStyleType = config.visConfig.rasterStyleType;
    if (rasterStyleType === 'Rgb') {
      return {
        channelProps: getRasterTileLayerStylePropsRgb({
          layerConfig: config,
          rasterMetadata,
          visualChannels,
        }),
        scales: {
          fillColor: {
            type: 'identity',
          },
        },
      };
    } else {
      const {dataTransform, updateTriggers, ...scaleProps} =
        getRasterTileLayerStylePropsScaledBand({
          layerConfig: config,
          visualChannels,
          rasterMetadata,
        });

      return {
        channelProps: {
          dataTransform,
          updateTriggers,
        },
        scales: {
          ...(scaleProps.type && {
            fillColor: scaleProps,
          }),
        },
      };
    }
  }
  const {textLabel, visConfig} = config;
  const result: Record<string, any> = {};
  const updateTriggers: Record<string, any> = {};

  const scales: Record<string, Scale> = {};

  // fill color
  {
    const {colorField, colorScale} = visualChannels;
    const {colorRange} = visConfig;
    const {field, aggregation, domainOverride} = resolveCustomAggregation({
      field: colorField,
      aggregation: visConfig.colorAggregation,
      expression: visConfig.colorAggregationExp,
      domain: visConfig.colorAggregationDomain,
      providerId: dataset.providerId,
    });
    if (field && colorScale && colorRange) {
      const {accessor, ...scaleProps} = getColorAccessor(
        field,
        colorScale,
        {aggregation, range: colorRange, domainOverride},
        visConfig.opacity,
        data
      );
      result.getFillColor = accessor;
      scales.fillColor = updateTriggers.getFillColor = {
        field,
        type: colorScale,
        ...scaleProps,
      };
    } else {
      scales.fillColor = {} as any;
    }
  }

  if (layerType === 'clusterTile') {
    const aggregationExpAlias = getDefaultAggregationExpColumnAliasForLayerType(
      layerType,
      dataset.providerId,
      data.schema
    );

    result.pointType = visConfig.isTextVisible ? 'circle+text' : 'circle';
    result.clusterLevel = visConfig.clusterLevel;

    result.getWeight = (d: any) => {
      return d.properties[aggregationExpAlias];
    };

    updateTriggers.getWeight = aggregationExpAlias;

    result.getPointRadius = (d: any, info: any) => {
      return calculateClusterRadius(
        d.properties,
        info.data.attributes.stats,
        visConfig.radiusRange as [number, number],
        aggregationExpAlias
      );
    };
    updateTriggers.getPointRadius = {
      aggregationExpAlias,
      radiusRange: visConfig.radiusRange,
    };

    result.textCharacterSet = 'auto';
    result.textFontFamily = 'Inter, sans';
    result.textFontSettings = {sdf: true};
    result.textFontWeight = 600;

    result.getText = (d: any) =>
      TEXT_NUMBER_FORMATTER.format(d.properties[aggregationExpAlias]);

    updateTriggers.getText = aggregationExpAlias;

    result.getTextColor = config.textLabel[TEXT_LABEL_INDEX].color;
    result.textOutlineColor = [
      ...(config.textLabel[TEXT_LABEL_INDEX].outlineColor as number[]),
      TEXT_OUTLINE_OPACITY,
    ];
    result.textOutlineWidth = 5;
    result.textSizeUnits = 'pixels';

    result.getTextSize = (d: any, info: any) => {
      const radius = calculateClusterRadius(
        d.properties,
        info.data.attributes.stats,
        visConfig.radiusRange as [number, number],
        aggregationExpAlias
      );
      return calculateClusterTextFontSize(radius);
    };

    updateTriggers.getTextSize = {
      aggregationExpAlias,
      radiusRange: visConfig.radiusRange,
    };
  }

  // point radius
  {
    const {radiusField, radiusScale} = visualChannels;
    const {radiusRange} = visConfig;
    const {field, aggregation, domainOverride} = resolveCustomAggregation({
      field: radiusField,
      aggregation: visConfig.radiusAggregation,
      expression: visConfig.radiusAggregationExp,
      domain: visConfig.radiusAggregationDomain,
      providerId: dataset.providerId,
    });
    if (field && radiusRange && radiusScale) {
      const {accessor, ...scaleProps} = getSizeAccessor(
        field,
        radiusScale,
        aggregation,
        radiusRange,
        data,
        domainOverride
      );
      result.getPointRadius = accessor;
      scales.pointRadius = updateTriggers.getPointRadius = {
        field,
        type: radiusScale,
        ...scaleProps,
      };
    }
  }

  // stroke/outline color
  {
    const {strokeColorScale, strokeColorField} = visualChannels;
    const {strokeColorRange} = visConfig;
    const {field, aggregation, domainOverride} = resolveCustomAggregation({
      field: strokeColorField,
      aggregation: visConfig.strokeColorAggregation,
      expression: visConfig.strokeColorAggregationExp,
      domain: visConfig.strokeColorAggregationDomain,
      providerId: dataset.providerId,
    });
    if (field && strokeColorRange && strokeColorScale) {
      const opacity =
        visConfig.strokeOpacity !== undefined ? visConfig.strokeOpacity : 1;
      const {accessor, ...scaleProps} = getColorAccessor(
        field,
        strokeColorScale,
        {aggregation, range: strokeColorRange, domainOverride},
        opacity,
        data
      );
      result.getLineColor = accessor;
      scales.lineColor = updateTriggers.getLineColor = {
        field,
        type: strokeColorScale,
        ...scaleProps,
      };
    }
  }

  // stroke/line width
  {
    const {sizeField: strokeWidthField, sizeScale: strokeWidthScale} =
      visualChannels;
    const {sizeRange} = visConfig;
    const {field, aggregation, domainOverride} = resolveCustomAggregation({
      field: strokeWidthField,
      aggregation: visConfig.sizeAggregation,
      expression: visConfig.sizeAggregationExp,
      domain: visConfig.sizeAggregationDomain,
      providerId: dataset.providerId,
    });
    if (field && sizeRange) {
      const {accessor, ...scaleProps} = getSizeAccessor(
        field,
        strokeWidthScale,
        aggregation,
        sizeRange,
        data,
        domainOverride
      );
      result.getLineWidth = accessor;
      scales.lineWidth = updateTriggers.getLineWidth = {
        field,
        type: strokeWidthScale || 'identity',
        ...scaleProps,
      };
    }
  }

  // height / elevation
  {
    const {heightField, heightScale} = visualChannels;
    const {enable3d, heightRange} = visConfig;
    const {field, aggregation, domainOverride} = resolveCustomAggregation({
      field: heightField,
      aggregation: visConfig.heightAggregation,
      expression: visConfig.heightAggregationExp,
      domain: visConfig.heightAggregationDomain,
      providerId: dataset.providerId,
    });
    if (field && heightRange && enable3d) {
      const {accessor, ...scaleProps} = getSizeAccessor(
        field,
        heightScale,
        aggregation,
        heightRange,
        data,
        domainOverride
      );
      result.getElevation = accessor;
      scales.elevation = updateTriggers.getElevation = {
        field,
        type: heightScale || 'identity',
        ...scaleProps,
      };
    }
  }

  // weight
  {
    const {weightField} = visualChannels;
    const {field, aggregation, domainOverride} = resolveCustomAggregation({
      field: weightField,
      aggregation: visConfig.weightAggregation,
      expression: visConfig.weightAggregationExp,
      domain: visConfig.weightAggregationDomain,
      providerId: dataset.providerId,
    });
    if (field && (aggregation || visConfig.weightAggregation === 'custom')) {
      const {accessor, ...scaleProps} = getSizeAccessor(
        field,
        undefined,
        aggregation,
        undefined,
        data,
        domainOverride
      );
      result.getWeight = accessor;
      scales.weight = updateTriggers.getWeight = {
        field,
        type: 'identity' as ScaleType,
        ...scaleProps,
      };
    }
  }

  if (visConfig.customMarkers) {
    const maxIconSize = getMaxMarkerSize(visConfig, visualChannels);
    const {getPointRadius, getFillColor} = result;
    const {
      customMarkersUrl,
      customMarkersRange,
      filled: useMaskedIcons,
    } = visConfig;

    result.pointType = 'icon';
    result.getIcon = getIconUrlAccessor(
      visualChannels.customMarkersField,
      customMarkersRange,
      {fallbackUrl: customMarkersUrl, maxIconSize, useMaskedIcons},
      data
    );
    updateTriggers.getIcon = {
      customMarkersUrl,
      customMarkersRange,
      maxIconSize,
      useMaskedIcons,
    };
    result._subLayerProps = {
      'points-icon': {
        loadOptions: {
          image: {
            type: 'imagebitmap',
          },
          imagebitmap: {
            resizeWidth: maxIconSize,
            resizeHeight: maxIconSize,
            resizeQuality: 'high',
          },
        },
      },
    };

    if (getFillColor && useMaskedIcons) {
      result.getIconColor = getFillColor;
      updateTriggers.getIconColor = updateTriggers.getFillColor;
    }

    if (getPointRadius) {
      result.getIconSize = getPointRadius;
      updateTriggers.getIconSize = updateTriggers.getPointRadius;
    }

    if (visualChannels.rotationField) {
      const {accessor} = getSizeAccessor(
        visualChannels.rotationField,
        undefined,
        null,
        undefined,
        data
      );
      result.getIconAngle = negateAccessor(accessor);
      updateTriggers.getIconAngle = updateTriggers.getRotationField;
    }
  } else if (layerType === 'tileset') {
    result.pointType = 'circle';
  }

  if (textLabel && textLabel.length && textLabel[0].field) {
    const [mainLabel, secondaryLabel] = textLabel;
    const collisionGroup = id;

    ({
      alignment: result.getTextAlignmentBaseline,
      anchor: result.getTextAnchor,
      color: result.getTextColor,
      outlineColor: result.textOutlineColor,
      size: result.textSizeScale,
    } = mainLabel);
    const {
      color: getSecondaryColor,
      field: secondaryField,
      outlineColor: secondaryOutlineColor,
      size: secondarySizeScale,
    } = secondaryLabel || {};

    result.getText = mainLabel.field && getTextAccessor(mainLabel.field, data);
    const getSecondaryText =
      secondaryField && getTextAccessor(secondaryField, data);

    result.pointType = `${result.pointType}+text`;
    result.textCharacterSet = 'auto';
    result.textFontFamily = 'Inter, sans';
    result.textFontSettings = {sdf: true};
    result.textFontWeight = 600;
    result.textOutlineWidth = 3;

    result._subLayerProps = {
      ...result._subLayerProps,
      'points-text': {
        collisionEnabled: true,
        collisionGroup,

        // getPointRadius already has radiusScale baked in, so only pass one or the other
        ...(result.getPointRadius
          ? {getRadius: result.getPointRadius}
          : {radiusScale: visConfig.radius}),

        ...(secondaryField && {
          getSecondaryText,
          getSecondaryColor,
          secondarySizeScale,
          secondaryOutlineColor,
        }),
      },
    };
  }

  return {
    channelProps: {
      ...result,
      updateTriggers,
    },
    scales,
  };
}

function createLoadOptions(accessToken: string) {
  return {
    loadOptions: {fetch: {headers: {Authorization: `Bearer ${accessToken}`}}},
  };
}
