// import {TileFormat} from '../constants';
// import {RasterSourceOptions} from '../sources';
// import {WidgetSourceProps} from './widget-source';
import {WidgetTilesetSource} from './widget-tileset-source';

// export type WidgetRasterSourceProps = WidgetSourceProps &
//   Omit<RasterSourceOptions, 'filters'> & {
//     tileFormat: TileFormat;
//     spatialDataType: 'quadbin'; // TODO: ???
//   };

export type WidgetRasterSourceResult = {widgetSource: WidgetRasterSource};

export class WidgetRasterSource extends WidgetTilesetSource {}
