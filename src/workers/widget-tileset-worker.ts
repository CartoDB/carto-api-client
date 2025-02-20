import {
  WidgetTilesetSource,
  type WidgetTilesetSourceProps,
} from '../widget-sources/widget-tileset-source.js';
import {Method} from './constants.js';
import type {WorkerRequest, WorkerResponse} from './types.js';

// TODO: Cannot rely on tableName as unique ID.
const SOURCES_BY_NAME = new Map<string, WidgetTilesetSource>();

addEventListener('message', (e) => {
  const {tableName, method, params, requestId} = e.data as WorkerRequest;

  if (method === Method.INIT) {
    const props = params[0] as WidgetTilesetSourceProps;
    SOURCES_BY_NAME.set(tableName, new WidgetTilesetSource(props));
    return;
  }

  const source = SOURCES_BY_NAME.get(tableName);

  if (!source) {
    const error = `Unknown dataset: ${tableName}`;
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
