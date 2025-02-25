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
 * Wrapper for {@link WidgetTilesetSource}, moving calculations to Web Workers.
 * When supported, use of both classes is identical.
 *
 * To use this wrapper, the application and environment must support ESM Web
 * Workers. For older build systems based on CommonJS, or in environments like
 * Node.js, it may be necessary to use {@link WidgetTilesetSource} directly,
 * and to (optionally) create workers manually in the application.
 */
export class WidgetTilesetWorkerSource extends WidgetSource<WidgetTilesetSourceProps> {
  constructor(props: WidgetTilesetSourceProps) {
    super(props);
  }

  destroy() {
    this._worker?.terminate();
    this._worker = null;
    super.destroy();
  }

  /////////////////////////////////////////////////////////////////////////////
  // WEB WORKER MANAGEMENT

  protected _worker: Worker | null = null;
  protected _workerNextRequestId = 1;

  /**
   * Returns an initialized Worker, to be reused for the lifecycle of this
   * source instance.
   */
  protected _getWorker() {
    if (this._worker) {
      return this._worker;
    }

    this._worker = new Worker(
      new URL('@carto/api-client/worker', import.meta.url),
      {
        type: 'module',
        name: 'cartowidgettileset',
      }
    );

    this._worker.postMessage({
      method: Method.INIT,
      params: [this.props],
    } as WorkerRequest);

    return this._worker;
  }

  /** Executes a given method on the worker. */
  protected _executeWorkerMethod<T>(
    method: Method,
    params: unknown[],
    signal?: AbortSignal
  ): Promise<T> {
    const worker = this._getWorker();
    const requestId = this._workerNextRequestId++;

    // TODO: ViewState may contain non-serializable data, which we do not need.
    // Remove this sanitization after sc-469614 is fixed.
    const options = params[0] as any;
    if (options?.spatialIndexReferenceViewState) {
      const {zoom, latitude, longitude} =
        options.spatialIndexReferenceViewState;
      options.spatialIndexReferenceViewState = {zoom, latitude, longitude};
    }

    let resolve: ((value: T) => void) | null = null;
    let reject: ((reason: any) => void) | null = null;

    // If worker sends message to main process, check whether it's a response
    // to this request, and whether the request can been aborted. Then resolve
    // or reject the Promise.
    function onMessage(e: MessageEvent) {
      const response = e.data as WorkerResponse;
      if (response.requestId !== requestId) return;

      if (signal?.aborted) {
        reject!(new Error(signal.reason));
      } else if (response.ok) {
        resolve!(response.result as T);
      } else {
        reject!(new Error(response.error));
      }
    }

    // If request is aborted by user, immediately reject the Promise.
    function onAbort() {
      reject!(new Error(signal!.reason));
    }

    worker.addEventListener('message', onMessage);
    signal?.addEventListener('abort', onAbort);

    // Send the task to the worker, creating a Promise to resolve/reject later.
    const promise = new Promise<T>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;

      worker.postMessage({
        requestId,
        method,
        params,
      } as WorkerRequest);
    });

    // Whether the task completes, fails, or aborts: clean up afterward.
    void promise.finally(() => {
      worker.removeEventListener('message', onMessage);
      signal?.removeEventListener('abort', onAbort);
    });

    return promise;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DATA LOADING

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

    this._getWorker().postMessage({
      method: Method.LOAD_TILES,
      params: [tiles],
    } as WorkerRequest);
  }

  /** Configures options used to extract features from tiles. */
  setTileFeatureExtractOptions(options: TileFeatureExtractOptions) {
    this._getWorker().postMessage({
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
    this._getWorker().postMessage({
      method: Method.LOAD_GEOJSON,
      params: [{geojson, spatialFilter}],
    } as WorkerRequest);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WIDGETS API

  // eslint-disable-next-line @typescript-eslint/require-await
  override async getFeatures(): Promise<FeaturesResponse> {
    throw new Error('getFeatures not supported for tilesets');
  }

  async getFormula({
    signal,
    ...options
  }: FormulaRequestOptions): Promise<FormulaResponse> {
    return this._executeWorkerMethod(Method.GET_FORMULA, [options], signal);
  }

  override async getHistogram({
    signal,
    ...options
  }: HistogramRequestOptions): Promise<HistogramResponse> {
    return this._executeWorkerMethod(Method.GET_HISTOGRAM, [options], signal);
  }

  override async getCategories({
    signal,
    ...options
  }: CategoryRequestOptions): Promise<CategoryResponse> {
    return this._executeWorkerMethod(Method.GET_CATEGORIES, [options], signal);
  }

  override async getScatter({
    signal,
    ...options
  }: ScatterRequestOptions): Promise<ScatterResponse> {
    return this._executeWorkerMethod(Method.GET_SCATTER, [options], signal);
  }

  override async getTable({
    signal,
    ...options
  }: TableRequestOptions): Promise<TableResponse> {
    return this._executeWorkerMethod(Method.GET_TABLE, [options], signal);
  }

  override async getTimeSeries({
    signal,
    ...options
  }: TimeSeriesRequestOptions): Promise<TimeSeriesResponse> {
    return this._executeWorkerMethod(Method.GET_TIME_SERIES, [options], signal);
  }

  override async getRange({
    signal,
    ...options
  }: RangeRequestOptions): Promise<RangeResponse> {
    return this._executeWorkerMethod(Method.GET_RANGE, [options], signal);
  }
}
