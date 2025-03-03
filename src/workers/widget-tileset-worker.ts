import {WidgetTilesetSourceImpl} from '../widget-sources/widget-tileset-source-impl.js';
import {type WidgetTilesetSourceProps} from '../widget-sources/widget-tileset-source.js';
import {Method} from './constants.js';
import type {WorkerRequest, WorkerResponse} from './types.js';

/*
 * Web Worker, compiled as a separate `@carto/api-client/worker` entrypoint.
 *
 * Workers are scoped to the lifecycle of a single WidgetTilesetSource instance,
 * representing and executing calculations on a single datasource.
 */

let source: WidgetTilesetSourceImpl;

addEventListener('message', (e) => {
  const {method, params, requestId} = e.data as WorkerRequest;

  if (method === Method.INIT) {
    source = new WidgetTilesetSourceImpl({
      ...(params[0] as WidgetTilesetSourceProps),
      widgetWorker: false,
    });
    return;
  }

  if (!source) {
    const error = `Cannot execute "${method}" on uninitialized source.`;
    postMessage({ok: false, error, requestId} as WorkerResponse);
    return;
  }

  // @ts-expect-error No type-checking dynamic method name.
  Promise.resolve(source[method](...params))
    .then((result) => {
      postMessage({ok: true, result, requestId} as WorkerResponse);
    })
    .catch((error) => {
      postMessage({ok: false, error, requestId} as WorkerResponse);
    });
});
