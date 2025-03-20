import {LayerType, SCALE_TYPE} from './layer-map.js';
import {Format, MapType, QueryParameters} from '../types.js';
import {TilejsonResult, GeojsonResult, JsonResult} from '../sources/types.js';

export type VisualChannelField = {
  name: string;
  type: string;
  colorColumn?: string;
};

export type VisualChannels = {
  colorField?: VisualChannelField;
  colorScale?: SCALE_TYPE;

  customMarkersField?: VisualChannelField;
  customMarkersScale?: SCALE_TYPE;

  radiusField?: VisualChannelField;
  radiusScale?: SCALE_TYPE;

  rotationScale?: SCALE_TYPE;
  rotationField?: VisualChannelField;

  sizeField?: VisualChannelField;
  sizeScale?: SCALE_TYPE;

  strokeColorField?: VisualChannelField;
  strokeColorScale?: SCALE_TYPE;

  heightField?: VisualChannelField;
  heightScale?: SCALE_TYPE;

  weightField?: VisualChannelField;
};

export type ColorRange = {
  category: string;
  colors: string[];
  colorMap: string[][] | undefined;
  name: string;
  type: string;
};

export type CustomMarkersRange = {
  markerMap: {
    value: string;
    markerUrl?: string;
  }[];
  othersMarker?: string;
};

export type VisConfig = {
  filled?: boolean;
  opacity?: number;
  enable3d?: boolean;

  colorAggregation?: any;
  colorRange: ColorRange;

  customMarkers?: boolean;
  customMarkersRange?: CustomMarkersRange | null;
  customMarkersUrl?: string | null;

  radius: number;
  radiusRange?: number[];

  sizeAggregation?: any;
  sizeRange?: any;

  strokeColorAggregation?: any;
  strokeOpacity?: number;
  strokeColorRange?: ColorRange;

  heightRange?: any;
  heightAggregation?: any;

  weightAggregation?: any;
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

export type MapDataset = {
  id: string;
  data: any;
  aggregationExp: string | null;
  aggregationResLevel: number | null;
  geoColumn: string;
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
  data: TilejsonResult | GeojsonResult | JsonResult;
  columns: string[];
  format: Format;
  aggregationExp: string;
  aggregationResLevel: number;
  queryParameters: QueryParameters;
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
