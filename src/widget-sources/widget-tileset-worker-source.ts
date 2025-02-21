import {
  CategoryRequestOptions,
  CategoryResponse,
  FeaturesResponse,
  FormulaRequestOptions,
  FormulaResponse,
  HistogramRequestOptions,
  HistogramResponse,
  RangeRequestOptions,
  RangeResponse,
  ScatterRequestOptions,
  ScatterResponse,
  TableRequestOptions,
  TableResponse,
  TimeSeriesRequestOptions,
  TimeSeriesResponse,
} from './types.js';
import {SpatialFilter, Tile} from '../types.js';
import {TileFeatureExtractOptions} from '../filters/index.js';
import {FeatureCollection} from 'geojson';
import {WidgetSource} from './widget-source.js';
import {WidgetTilesetSourceProps} from './widget-tileset-source.js';
import {Method} from '../workers/constants.js';
import {WorkerRequest, WorkerResponse} from '../workers/types.js';

/**
 * TODO
 */
export class WidgetTilesetWorkerSource extends WidgetSource<WidgetTilesetSourceProps> {
  constructor(props: WidgetTilesetSourceProps) {
    super(props);

    WidgetTilesetWorkerSource.init();
    WidgetTilesetWorkerSource.WORKER.postMessage({
      tableName: this.props.tableName,
      method: Method.INIT,
      params: [this.props],
    } as WorkerRequest);
  }

  /**
   * Loads features as a list of tiles (typically provided by deck.gl).
   * After tiles are loaded, {@link extractTileFeatures} must be called
   * before computing statistics on the tiles.
   */
  loadTiles(tiles: unknown[]) {
    tiles = (tiles as Tile[]).map(({id, bbox, data}) => ({
      id,
      bbox,
      data,
    }));

    WidgetTilesetWorkerSource.WORKER.postMessage({
      tableName: this.props.tableName,
      method: Method.LOAD_TILES,
      params: [tiles],
    } as WorkerRequest);
  }

  /** Configures options used to extract features from tiles. */
  setTileFeatureExtractOptions(options: TileFeatureExtractOptions) {
    WidgetTilesetWorkerSource.WORKER.postMessage({
      tableName: this.props.tableName,
      type: Method.SET_TILE_FEATURE_EXTRACT_OPTIONS,
      params: [options],
    });
  }

  /**
   * Loads features as GeoJSON (used for testing).
   * @experimental
   * @internal Not for public use. Spatial filters in other method calls will be ignored.
   */
  loadGeoJSON({
    geojson,
    spatialFilter,
  }: {
    geojson: FeatureCollection;
    spatialFilter: SpatialFilter;
  }) {
    WidgetTilesetWorkerSource.WORKER.postMessage({
      tableName: this.props.tableName,
      method: Method.LOAD_GEOJSON,
      params: [{geojson, spatialFilter}],
    } as WorkerRequest);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async getFeatures(): Promise<FeaturesResponse> {
    throw new Error('getFeatures not supported for tilesets');
  }

  async getFormula({
    abortController,
    ...options
  }: FormulaRequestOptions): Promise<FormulaResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_FORMULA,
      [options],
      abortController?.signal
    );
  }

  override async getHistogram({
    abortController,
    ...options
  }: HistogramRequestOptions): Promise<HistogramResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_HISTOGRAM,
      [options],
      abortController?.signal
    );
  }

  override async getCategories({
    abortController,
    ...options
  }: CategoryRequestOptions): Promise<CategoryResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_CATEGORIES,
      [options],
      abortController?.signal
    );
  }

  override async getScatter({
    abortController,
    ...options
  }: ScatterRequestOptions): Promise<ScatterResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_SCATTER,
      [options],
      abortController?.signal
    );
  }

  override async getTable({
    abortController,
    ...options
  }: TableRequestOptions): Promise<TableResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_TABLE,
      [options],
      abortController?.signal
    );
  }

  override async getTimeSeries({
    abortController,
    ...options
  }: TimeSeriesRequestOptions): Promise<TimeSeriesResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_TIME_SERIES,
      [options],
      abortController?.signal
    );
  }

  override async getRange({
    abortController,
    ...options
  }: RangeRequestOptions): Promise<RangeResponse> {
    return this._executeWorkerMethod(
      this.props.tableName,
      Method.GET_RANGE,
      [options],
      abortController?.signal
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // WEB WORKER MANAGEMENT

  // TODO: Singleton? Pool shared among datasets? One per dataset?
  protected static WORKER: Worker;
  protected static _nextRequestID = 1;

  static init() {
    WidgetTilesetWorkerSource.WORKER = new Worker(
      new URL('../workers/widget-tileset-worker.js', import.meta.url),
      {
        type: 'module',
        name: 'cartowidgettileset',
      }
    );
  }

  _executeWorkerMethod<T>(
    tableName: string,
    method: Method,
    params: unknown[],
    signal?: AbortSignal
  ): Promise<T> {
    const worker = WidgetTilesetWorkerSource.WORKER;
    const requestId = WidgetTilesetWorkerSource._nextRequestID++;

    // TODO: ViewState may contain non-serializable data, which we do not need.
    // Remove this sanitization after sc-469614 is fixed.
    const options = params[0] as any;
    if (options?.spatialIndexReferenceViewState) {
      const {zoom, latitude, longitude} =
        options.spatialIndexReferenceViewState;
      options.spatialIndexReferenceViewState = {zoom, latitude, longitude};
    }

    worker.postMessage({
      requestId,
      tableName,
      method,
      params,
    } as WorkerRequest);

    return new Promise((resolve, reject) => {
      function listener(e: MessageEvent) {
        const response = e.data as WorkerResponse;
        if (response.requestId !== requestId) return;

        worker.removeEventListener('message', listener);

        if (signal?.aborted) {
          reject(new Error(signal.reason));
        } else if (response.ok) {
          resolve(response.result as T);
        } else {
          reject(new Error(response.error));
        }
      }

      worker.addEventListener('message', listener);
    });
  }
}
