import type {LayerType, ScaleType} from './layer-map.js';
import type {Format, MapType, ProviderType, QueryParameters} from '../types.js';
import type {TilejsonResult} from '../sources/types.js';

export type VisualChannelField = {
  name: string;
  type: string;
  colorColumn?: string;
};

export type VisualChannels = {
  colorField?: VisualChannelField;
  colorScale?: ScaleType;

  customMarkersField?: VisualChannelField;
  customMarkersScale?: ScaleType;

  radiusField?: VisualChannelField;
  radiusScale?: ScaleType;

  rotationScale?: ScaleType;
  rotationField?: VisualChannelField;

  sizeField?: VisualChannelField;
  sizeScale?: ScaleType;

  strokeColorField?: VisualChannelField;
  strokeColorScale?: ScaleType;

  heightField?: VisualChannelField;
  heightScale?: ScaleType;

  weightField?: VisualChannelField;
  uniqueValuesColorScale?: ScaleType;
};

export type ColorRange = {
  category: string;
  colors: string[];
  colorMap: string[][] | undefined;
  name: string;
  type: string;
  uiCustomScaleType?: 'logarithmic';
};

export type CustomMarkersRange = {
  markerMap: {
    value: string;
    markerUrl?: string;
  }[];
  othersMarker?: string;
};

export type ColorBand = 'red' | 'green' | 'blue' | 'alpha';

export type RasterLayerConfigColorBand = {
  band: ColorBand;
  type: 'none' | 'band' | 'expression';
  value: string; // band name or expression
};

export type VisConfig = {
  filled?: boolean;
  opacity?: number;
  enable3d?: boolean;

  colorAggregation?: string;
  colorRange: ColorRange;

  customMarkers?: boolean;
  customMarkersRange?: CustomMarkersRange | null;
  customMarkersUrl?: string | null;

  radius: number;
  radiusRange?: number[];
  radiusAggregation?: string;

  sizeAggregation?: string;
  sizeRange?: number[];

  strokeColorAggregation?: string;
  strokeOpacity?: number;
  strokeColorRange?: ColorRange;

  heightRange?: number[];
  heightAggregation?: string;

  weightAggregation?: string;

  // type = clusterTile
  clusterLevel?: number;
  isTextVisible?: boolean;

  rasterStyleType?: 'Rgb' | 'ColorRange' | 'UniqueValues';
  colorBands?: RasterLayerConfigColorBand[];

  uniqueValuesColorRange?: ColorRange;
};

export type TextLabel = {
  field: VisualChannelField | null | undefined;
  alignment?: 'center' | 'bottom' | 'top';
  anchor?: 'middle' | 'start' | 'end';
  size: number;
  color?: number[];
  offset?: [number, number];
  outlineColor?: number[];
};

export type MapLayerConfig = {
  columns?: Record<string, any>;
  color?: number[];
  label?: string;
  dataId: string;
  textLabel: TextLabel[];
  visConfig: VisConfig;
};

export type MapConfigLayer = {
  type: LayerType;
  id: string;
  config: MapLayerConfig;
  visualChannels: VisualChannels;
};

export interface CustomStyle {
  url?: string;
  style?: any;
  customAttribution?: string;
}

// TODO replace with more complete type from Builder
export type KeplerMapConfig = {
  filters: any;
  mapState: any;
  mapStyle: {
    styleType: string;
    visibleLayerGroups: Record<string, boolean>;
  };
  legendSettings?: any;
  popupSettings: any;
  visState: {
    layers: MapConfigLayer[];
    layerBlending: any;
    interactionConfig: any;
  };
  customBaseMaps?: {
    customStyle?: CustomStyle;
  };
};

export type BasemapType = 'maplibre' | 'google-maps';

export type Basemap = MapLibreBasemap | GoogleBasemap;

export type BasemapCommon = {
  /**
   * Type of basemap.
   */
  type: BasemapType;

  /**
   * Custom attribution for style data if not provided by style definition.
   */
  attribution?: string;

  /**
   * Properties of the basemap. These properties are specific to the basemap type.
   */
  props: Record<string, any>;
};

export type MapLibreBasemap = BasemapCommon & {
  type: 'maplibre';

  /**
   * MapLibre map properties.
   *
   * Meant to be passed to directly to `maplibregl.Map` object.
   */
  props: MapLibreBasemapProps;

  /**
   * Layer groups to be displayed in the basemap.
   */
  visibleLayerGroups?: Record<string, boolean>;

  /**
   * If `style` has been filtered by `visibleLayerGroups` then this property contains original style object, so user
   * can use `applyLayerGroupFilters` again with new settings.
   */
  rawStyle?: string | Record<string, any>;
};

// Cherry-pick of maplibregl Map API props that are supported/provided by fetchMap interface
export type MapLibreBasemapProps = {
  style: string | Record<string, any>;
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
};

export type GoogleBasemap = BasemapCommon & {
  type: 'google-maps';

  /**
   * Google map properties.
   *
   * Meant to be passed to directly to `google.maps.Map` object.
   */
  props: GoogleBasemapProps;
};

// Cherry-pick of Google Map API props that are supported/provided by fetchMap interface
export type GoogleBasemapProps = {
  mapTypeId: string;
  mapId?: string;
  center?: {lat: number; lng: number};
  zoom?: number;
  tilt?: number;
  heading?: number;
};

export type Dataset = {
  id: string;
  type: MapType;
  source: string;
  cache?: number;
  connectionName: string;
  geoColumn: string;
  data: TilejsonResult;
  columns: string[];
  format: Format;
  aggregationExp: string;
  aggregationResLevel: number;
  queryParameters: QueryParameters;
  connectionId?: string;
  providerId: ProviderType;
  createdAt?: string;
  updatedAt?: string;
  label?: string;
  color?: string;
  uniqueIdProperty?: string;
  queryTemplate?: string | null;
  name?: string | null;
  spatialIndex?: string | null;
  exportToBucketAvailable?: boolean;
};

export type AttributeType = 'String' | 'Number' | 'Timestamp' | 'Boolean';

export type AttributeStatsBase = {
  attribute: string;
  type: AttributeType;
};

export type AttributeStatsNumber = AttributeStatsBase & {
  type: 'Number';
  min: number;
  avg: number;
  max: number;
  sum: number;
  quantiles: number[][];
};

export type AttributeStatsTimestamp = AttributeStatsBase & {
  type: 'Timestamp';
  min: string;
  max: string;
};

export interface AttributeStatsStringCategory {
  category: string;
  frequency: number;
}

export type AttributeStatsString = AttributeStatsBase & {
  type: 'String' | 'Boolean';
  categories: AttributeStatsStringCategory[];
};

/**
 * Result of getAttributeStats request to backend.
 */
export type AttributeStats =
  | AttributeStatsString
  | AttributeStatsNumber
  | AttributeStatsTimestamp;
