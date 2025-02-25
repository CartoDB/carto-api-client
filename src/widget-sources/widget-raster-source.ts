import {RasterMetadata} from '../sources/index.js';
import {
  WidgetTilesetSource,
  WidgetTilesetSourceProps,
} from './widget-tileset-source.js';

export type WidgetRasterSourceProps = WidgetTilesetSourceProps & {
  rasterMetadata: RasterMetadata;
  spatialDataType: 'quadbin';
};

export type WidgetRasterSourceResult = {widgetSource: WidgetRasterSource};

export class WidgetRasterSource extends WidgetTilesetSource<WidgetRasterSourceProps> {}
