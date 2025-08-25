import type {
  AggregationsRequestOptions,
  AggregationsResponse,
  CategoryRequestOptions,
  CategoryResponse,
  ExtentResponse,
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
import type {SpatialFilter, Tile} from '../types.js';
import type {TileFeatureExtractOptions} from '../filters/index.js';
import type {BBox, FeatureCollection} from 'geojson';
import {WidgetSource, type WidgetSourceProps} from './widget-source.js';
import {Method} from '../workers/constants.js';
import type {WorkerRequest, WorkerResponse} from '../workers/types.js';
import type {SpatialDataType, TilesetSourceOptions} from '../sources/types.js';
import {TileFormat} from '../constants.js';
import {WidgetTilesetSourceImpl} from './widget-tileset-source-impl.js';

export type WidgetTilesetSourceProps = WidgetSourceProps &
  Omit<TilesetSourceOptions, 'filters'> & {
    tileFormat: TileFormat;
    spatialDataType: SpatialDataType;
    /**
     * Extent of spatial data, typically from TileJSON. Does not include filters.
     */
    spatialDataBounds: BBox;
  };

export type WidgetTilesetSourceResult = {widgetSource: WidgetTilesetSource};

/**
 * Source for Widget API requests on a data source defined by a tileset.
 *
 * Generally not intended to be constructed directly. Instead, call
 * {@link vectorTilesetSource}, {@link h3TilesetSource}, or {@link quadbinTilesetSource},
 * which can be shared with map layers. Sources contain a `widgetSource`
 * property, for use by widget implementations.
 *
 * Example:
 *
 * ```javascript
 * import { vectorTilesetSource } from '@carto/api-client';
 *
 * const data = vectorTilesetSource({
 *   accessToken: '••••',
 *   connectionName: 'carto_dw',
 *   tableName: 'carto-demo-data.demo_rasters.my_tileset_source'
 * });
 *
 * const { widgetSource } = await data;
 * ```
 */
export class WidgetTilesetSource<
  Props extends WidgetTilesetSourceProps = WidgetTilesetSourceProps,
> extends WidgetSource<Props> {
  protected _localImpl: WidgetTilesetSourceImpl | null = null;

  protected _workerImpl: Worker | null = null;
  protected _workerEnabled: boolean;
  protected _workerNextRequestId = 1;

  constructor(props: Props) {
    super(props);

    this._workerEnabled =
      (props.widgetWorker ?? true) &&
      TSUP_FORMAT !== 'cjs' &&
      typeof Worker !== 'undefined';

    if (!this._workerEnabled) {
      this._localImpl = new WidgetTilesetSourceImpl(this.props);
    }
  }

  destroy() {
    this._localImpl?.destroy();
    this._localImpl = null;

    this._workerImpl?.terminate();
    this._workerImpl = null;

    super.destroy();
  }

  /////////////////////////////////////////////////////////////////////////////
  // WEB WORKER MANAGEMENT

  /**
   * Returns an initialized Worker, to be reused for the lifecycle of this
   * source instance.
   */
  protected _getWorker(): Worker {
    if (this._workerImpl) {
      return this._workerImpl;
    }

    if (this.props.widgetWorkerUrl) {
      this._workerImpl = new Worker(this.props.widgetWorkerUrl, {
        name: 'cartowidgettileset',
      });
    } else {
      // For Vite (and perhaps other bundlers) to parse WorkerOptions, it
      // must be a static, inline object – duplicated below.
      this._workerImpl = new Worker(
        new URL('@carto/api-client/worker', import.meta.url),
        {
          type: 'module',
          name: 'cartowidgettileset',
        }
      );
    }

    this._workerImpl.addEventListener('error', (e) => {
      console.error('widget-tileset-source worker error', e);
    });

    this._workerImpl.postMessage({
      method: Method.INIT,
      params: [this.props],
    } as WorkerRequest);

    return this._workerImpl;
  }

  /** Executes a given method on the worker. */
  protected _executeWorkerMethod<T>(
    method: Method,
    params: unknown[],
    signal?: AbortSignal
  ): Promise<T> {
    if (!this._workerEnabled) {
      // @ts-expect-error No type-checking dynamic method name.
      return this._localImpl[method](...params);
    }

    const worker = this._getWorker();
    const requestId = this._workerNextRequestId++;

    let resolve: ((value: T) => void) | null = null;
    let reject: ((reason: any) => void) | null = null;

    // If worker sends message to main process, check whether it's a response
    // to this request, and whether the request can been aborted. Then resolve
    // or reject the Promise.
    function onMessage(e: MessageEvent) {
      const response = e.data as WorkerResponse;
      if (response.requestId !== requestId) return;
      if (signal?.aborted) return; // handled by 'abort' listener

      if (response.ok) {
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
    if (!this._workerEnabled) {
      return this._localImpl!.loadTiles(tiles);
    }

    const worker = this._getWorker();

    // We cannot pass an instance of Tile2DHeader to a Web Worker, and must
    // extract properties required for widget calculations. Note that the
    // `tile: Tile = {...}` assignment is structured so TS will warn if any
    // types required by the internal 'Tile' type are missing.
    tiles = (tiles as Tile[]).map(
      ({id, index, bbox, isVisible, data}: Tile) => {
        const tile: Tile = {
          id,
          index,
          isVisible,
          data,
          bbox,
        };
        return tile;
      }
    );

    worker.postMessage({
      method: Method.LOAD_TILES,
      params: [tiles],
    } as WorkerRequest);
  }

  /** Configures options used to extract features from tiles. */
  setTileFeatureExtractOptions(options: TileFeatureExtractOptions) {
    if (!this._workerEnabled) {
      return this._localImpl?.setTileFeatureExtractOptions(options);
    }

    const worker = this._getWorker();

    worker.postMessage({
      method: Method.SET_TILE_FEATURE_EXTRACT_OPTIONS,
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
    if (!this._workerEnabled) {
      return this._localImpl!.loadGeoJSON({geojson, spatialFilter});
    }

    const worker = this._getWorker();

    worker.postMessage({
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

  async getAggregations({
    signal,
    ...options
  }: AggregationsRequestOptions): Promise<AggregationsResponse> {
    return this._executeWorkerMethod(
      Method.GET_AGGREGATIONS,
      [options],
      signal
    );
  }

  /** @experimental */
  async getExtent(): Promise<ExtentResponse> {
    return Promise.resolve({
      bbox: this.props.spatialDataBounds,
    });
  }
}
