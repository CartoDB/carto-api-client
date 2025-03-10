import {Filter, Format, MapType, QueryParameters} from '../types.js';
import {SCALE_TYPE} from './scales.js';

export type FetchMapOptions = {
  /**
   * CARTO platform access token. Only required for private maps.
   */
  accessToken?: string;

  /**
   * Base URL of the CARTO Maps API.
   *
   * Example for account located in EU-west region: `https://gcp-eu-west1.api.carto.com`
   *
   * @default https://gcp-us-east1.api.carto.com
   */
  apiBaseUrl?: string;

  /**
   * Identifier of map created in CARTO Builder.
   */
  cartoMapId: string;
  clientId?: string;

  /**
   * Custom HTTP headers added to map instantiation and data requests.
   */
  headers?: Record<string, string>;

  /**
   * Interval in seconds at which to autoRefresh the data. If provided, `onNewData` must also be provided.
   */
  autoRefresh?: number;

  /**
   * Callback function that will be invoked whenever data in layers is changed. If provided, `autoRefresh` must also be provided.
   */
  onNewData?: (map: any) => void;

  /**
   * Maximum URL character length. Above this limit, requests use POST.
   * Used to avoid browser and CDN limits.
   * @default {@link DEFAULT_MAX_LENGTH_URL}
   */
  maxLengthURL?: number;
};

export type Dataset = {
  id: string;
  type: MapType;
  source: string;
  connectionName: string;
  geoColumn?: string;
  columns?: string[];
  format?: Format;
  aggregationExp?: string;
  aggregationResLevel?: number;
  queryParameters: QueryParameters;
};

export type Map = {
  token: string;
  datasets: Dataset[];
  keplerMapConfig: KeplerMapConfig;
};

export type KeplerMapConfig = {
  config: {
    visState: {
      layers: MapConfigLayer[];
    };
    filters?: {[sourceId: string]: Filter};
  };
};

type MapConfigLayer = {
  type: string;
  id: string;
  config: MapLayerConfig;
  visualChannels: VisualChannels;
};

type MapLayerConfig = {
  columns?: Record<string, any>;
  color?: number[];
  label?: string;
  dataId: string;
  textLabel: TextLabel[];
  visConfig: VisConfig;
};

type VisualChannels = {
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

type TextLabel = {
  field: VisualChannelField | null | undefined;
  alignment?: 'center' | 'bottom' | 'top';
  anchor?: 'middle' | 'start' | 'end';
  size: number;
  color?: number[];
  offset?: [number, number];
  outlineColor?: number[];
};

type VisualChannelField = {
  name: string;
  type: string;
  colorColumn?: string;
  channelScaleType?: string;
};

type VisConfig = {
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

type ColorRange = {
  category: string;
  colors: string[];
  colorMap: string[][] | undefined;
  name: string;
  type: string;
};

type CustomMarkersRange = {
  markerMap: {
    value: string;
    markerUrl?: string;
  }[];
  othersMarker?: string;
};

export enum AttributeType {
  String = 'String',
  Number = 'Number',
  Timestamp = 'Timestamp',
  Boolean = 'Boolean',
}

export type AttributeStatsBase = {
  attribute: string;
  type: AttributeType;
};

export type AttributeStatsNumber = AttributeStatsBase & {
  type: AttributeType.Number;
  min: number;
  avg: number;
  max: number;
  sum: number;
  quantiles: number[][];
};

export type AttributeStatsTimestamp = AttributeStatsBase & {
  type: AttributeType.Timestamp;
  min: string;
  max: string;
};

export interface AttributeStatsStringCategory {
  category: string;
  frequency: number;
}

export type AttributeStatsString = AttributeStatsBase & {
  type: AttributeType.String | AttributeType.Boolean;
  categories: AttributeStatsStringCategory[];
};

/**
 * Result of getAttributeStats request to backend.
 */
export type AttributeStats =
  | AttributeStatsString
  | AttributeStatsNumber
  | AttributeStatsTimestamp;
