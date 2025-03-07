// import { vectorQuerySource, type H3QuerySourceOptions, type H3TableSourceOptions, type QuadbinQuerySourceOptions, type QuadbinTableSourceOptions, type QuerySourceOptions, type TableSourceOptions, type VectorQuerySourceOptions, type VectorTableSourceOptions, type VectorTileLayerProps, type VectorTilesetSourceOptions } from '@deck.gl/carto'
import { FetchMapOptions, Map } from './types.js'
import { DEFAULT_API_BASE_URL } from '../constants.js'
import { buildPublicMapUrl } from '../api/endpoints.js';
import { APIErrorContext } from '../api/carto-api-error.js';
import { requestWithParameters } from '../api/request-with-parameters.js';
import { fetchMapDataset } from './fetchMapDataset.js';

export async function getFetchMapConfig({
  accessToken,
  apiBaseUrl = DEFAULT_API_BASE_URL,
  cartoMapId,
  clientId,
  headers,
  autoRefresh,
  onNewData,
  maxLengthURL
}: FetchMapOptions) {

  if (accessToken) {
    headers = {Authorization: `Bearer ${accessToken}`, ...headers};
  }

  const baseUrl = buildPublicMapUrl({apiBaseUrl, cartoMapId});
  
  const errorContext: APIErrorContext = {requestType: 'Public map', mapId: cartoMapId};
  const map: Map = await requestWithParameters({baseUrl, headers, errorContext, maxLengthURL});

  const promises = map.datasets.map((dataset) =>
    fetchMapDataset({
      dataset,
      filters: map.keplerMapConfig?.filters?.[dataset.id],
      options: {
        accessToken: map.token,
        apiBaseUrl,
        connection: dataset.connectionName,
        headers
      }
    })
  );

  const datasetsFetched = await Promise.all(promises);

  debugger

  // TODO typar map
  // TODO AutoRefresh
  // TODO deprecate document mode
  // TODO cache
  // TODO linter import only types from deck.gl
  // TODO filters
  // TODO feature flag ReduceNumberOfQueries
  // TODO filters
  
  // const layerProps: [VectorTileLayerProps] = [
  //   {
  //     id: 'vector-tiles',
  //     data: null,
  //     getFillColor: [255, 255, 255, 255],
  //     getLineColor: [0, 0, 0, 255],
  //     getLineWidth: 1,
  //     getRadius: 100,
  //   }
  // ]
  // return layerProps
};
