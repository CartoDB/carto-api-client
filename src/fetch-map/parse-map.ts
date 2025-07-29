import type {ColorParameters} from '@luma.gl/core';
import {
  calculateClusterRadius,
  calculateClusterTextFontSize,
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
  type D3Scale,
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

export type Scale = {
  field: VisualChannelField;
  domain: string[] | number[];
  range: string[] | number[];
  type: ScaleType;
};

export type ScaleKey =
  | 'fillColor'
  | 'pointRadius'
  | 'lineColor'
  | 'elevation'
  | 'weight';

export type LayerDescriptor = {
  type: LayerType;
  props: Record<string, any>;
  filters?: Filters;
  scales: Partial<Record<ScaleKey, Scale>>;
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
      const opacity = config.visConfig[opacityKey as keyof VisConfig];
      color[3] = opacityToAlpha(opacity);
      result[colorAccessor] = color;
    }
  }

  result.highlightColor = config.visConfig.enable3d
    ? [255, 255, 255, 60]
    : [252, 242, 26, 255];
  return result;
}

function domainAndRangeFromScale(
  scale: D3Scale
): Pick<Scale, 'domain' | 'range'> {
  return {
    domain: scale.domain(),
    range: scale.range(),
  };
}

function createChannelProps(
  id: string,
  layerType: LayerType,
  config: MapLayerConfig,
  visualChannels: VisualChannels,
  data: any,
  dataset: Dataset
): {
  channelProps: Record<string, any>;
  scales: Partial<Record<ScaleKey, Scale>>;
} {
  const {
    colorField,
    colorScale,
    radiusField,
    radiusScale,
    strokeColorField,
    strokeColorScale,
    weightField,
  } = visualChannels;
  if (layerType === 'raster') {
    const rasterStyleType = config.visConfig.rasterStyleType;
    if (rasterStyleType === 'Rgb') {
      return {
        channelProps: getRasterTileLayerStylePropsRgb({
          layerConfig: config,
          rasterMetadata: data.raster_metadata,
          visualChannels,
        }),
        scales: {},
      };
    } else {
      return {
        channelProps: getRasterTileLayerStylePropsScaledBand({
          layerConfig: config,
          visualChannels,
          rasterMetadata: data.raster_metadata,
        }),
        scales: {
          ...(colorField && {
            fillColor: {
              field: colorField,
              type: 'ordinal',
              domain: [],
              range: [],
            },
          }),
        },
      };
    }
  }
  const {heightField, heightScale} = visualChannels;
  const {textLabel, visConfig} = config;
  const result: Record<string, any> = {};
  const updateTriggers: Record<string, any> = {};

  const scales: Record<string, Scale> = {};

  if (colorField) {
    const {colorAggregation: aggregation, colorRange: range} = visConfig;
    const {accessor, scale} = getColorAccessor(
      colorField,
      colorScale!,
      {aggregation, range},
      visConfig.opacity,
      data
    );
    result.getFillColor = accessor;
    scales.fillColor = updateTriggers.getFillColor = {
      field: colorField,
      type: colorScale!,
      ...domainAndRangeFromScale(scale),
    };
  } else if (visConfig.filled) {
    scales.fillColor = {} as any;
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

  if (radiusField) {
    const {accessor, scale} = getSizeAccessor(
      radiusField,
      radiusScale,
      visConfig.sizeAggregation,
      visConfig.radiusRange || visConfig.sizeRange,
      data
    );
    result.getPointRadius = accessor;
    scales.pointRadius = updateTriggers.getPointRadius = {
      field: radiusField,
      type: radiusScale || 'identity',
      ...domainAndRangeFromScale(scale),
    };
  }

  if (strokeColorField) {
    const opacity =
      visConfig.strokeOpacity !== undefined ? visConfig.strokeOpacity : 1;
    const {strokeColorAggregation: aggregation, strokeColorRange: range} =
      visConfig;
    const {accessor, scale} = getColorAccessor(
      strokeColorField,
      strokeColorScale!,
      {aggregation, range},
      opacity,
      data
    );
    result.getLineColor = accessor;
    scales.lineColor = updateTriggers.getLineColor = {
      field: strokeColorField,
      type: strokeColorScale!,
      ...domainAndRangeFromScale(scale),
    };
  }
  if (heightField && visConfig.enable3d) {
    const {accessor, scale} = getSizeAccessor(
      heightField,
      heightScale,
      visConfig.heightAggregation,
      visConfig.heightRange || visConfig.sizeRange,
      data
    );
    result.getElevation = accessor;
    scales.elevation = updateTriggers.getElevation = {
      field: heightField,
      type: heightScale || 'identity',
      ...domainAndRangeFromScale(scale),
    };
  }

  if (weightField) {
    const {accessor, scale} = getSizeAccessor(
      weightField,
      undefined,
      visConfig.weightAggregation,
      undefined,
      data
    );
    result.getWeight = accessor;
    scales.weight = updateTriggers.getWeight = {
      field: weightField,
      type: 'identity' as ScaleType,
      ...domainAndRangeFromScale(scale),
    };
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
