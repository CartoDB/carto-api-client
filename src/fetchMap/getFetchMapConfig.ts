import {FetchMapOptions, Map} from './types.js';
import {DEFAULT_API_BASE_URL} from '../constants.js';
import {buildPublicMapUrl} from '../api/endpoints.js';
import {APIErrorContext} from '../api/carto-api-error.js';
import {requestWithParameters} from '../api/request-with-parameters.js';
import {fetchMapDataset} from './fetchMapDataset.js';
import {fetchStats} from './fetchStats.js';
import {setClient} from '../client.js';

export async function getFetchMapConfig({
  accessToken,
  apiBaseUrl = DEFAULT_API_BASE_URL,
  cartoMapId,
  clientId,
  headers,
  autoRefresh,
  onNewData,
  maxLengthURL,
}: FetchMapOptions) {
  if (clientId) {
    setClient(clientId);
  }
  const baseUrl = buildPublicMapUrl({apiBaseUrl, cartoMapId});

  const errorContext: APIErrorContext = {
    requestType: 'Public map',
    mapId: cartoMapId,
  };
  const map: Map = await requestWithParameters({
    baseUrl,
    headers: accessToken
      ? {Authorization: `Bearer ${accessToken}`, ...headers}
      : headers,
    errorContext,
    maxLengthURL,
  });

  const mapToken = map.token;
  const datasets = map.datasets;
  const keplerMapConfig = map.keplerMapConfig;

  const datasetsPromises = datasets.map((dataset) =>
    fetchMapDataset({
      dataset,
      filters: map.keplerMapConfig?.config.filters?.[dataset.id],
      options: {
        accessToken: mapToken,
        apiBaseUrl,
        connection: dataset.connectionName,
        headers,
        maxLengthURL,
      },
    })
  );

  const [datasetsFetched, stats] = await Promise.all([
    Promise.all(datasetsPromises),
    fetchStats({
      datasets,
      keplerMapConfig,
      options: {
        accessToken: mapToken,
        apiBaseUrl,
        headers,
        maxLengthURL,
      },
    }),
  ]);
}

// import type {VectorTileLayerProps} from '@deck.gl/carto';

// const layerProps: [VectorTileLayerProps] = [
//   {
//     id: 'vector-tiles',
//     data: null,
//     getFillColor: [255, 255, 255, 255],
//     getLineColor: [0, 0, 0, 255],
//     getLineWidth: 1,
//     getRadius: 100,
//   },
// ];
// return layerProps;
