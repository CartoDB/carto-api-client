import {APIErrorContext} from '../api/carto-api-error.js';
import {buildStatsUrl} from '../api/endpoints.js';
import {requestWithParameters} from '../api/request-with-parameters.js';
import {CHANNEL_SCALES} from './scales.js';
import {AttributeStats, Dataset, KeplerMapConfig} from './types.js';

type FetchStatsOptions = {
  accessToken: string;
  apiBaseUrl: string;
  headers?: Record<string, string>;
  maxLengthURL?: number;
};

// TODO cache
export async function fetchStats({
  datasets,
  keplerMapConfig,
  options,
}: {
  datasets: Dataset[];
  keplerMapConfig: KeplerMapConfig;
  options: FetchStatsOptions;
}) {
  const statsPromises: Promise<{datasetId: string; stats: AttributeStats[]}>[] =
    [];
  const {layers} = keplerMapConfig.config.visState;

  // Track unique dataset-attribute combinations to prevent duplicates
  const processedAttributes = new Set<string>();

  for (const layer of layers) {
    const dataset = datasets.find((d) => d.id === layer.config.dataId);

    if (!dataset) continue;

    if (dataset.type === 'tileset') {
      continue;
    }

    for (const channel of Object.keys(layer.visualChannels) as Array<
      keyof typeof layer.visualChannels
    >) {
      const visualChannel = layer.visualChannels[channel];

      if (!visualChannel || typeof visualChannel !== 'object') continue;
      const {name, channelScaleType, colorColumn} = visualChannel;

      if (
        colorColumn ||
        (name && channelScaleType !== CHANNEL_SCALES.identity)
      ) {
        const attribute = colorColumn || name;
        const uniqueKey = `${dataset.id}-${attribute}`;

        // Skip if we've already processed this dataset-attribute combination
        if (processedAttributes.has(uniqueKey)) continue;
        processedAttributes.add(uniqueKey);

        const maxNumberOfCategories = colorColumn ? 1000 : 20;
        statsPromises.push(
          fetchAttributeStats({
            attribute,
            dataset,
            options,
            maxNumberOfCategories,
          }).then((stats) => ({
            datasetId: dataset.id,
            stats,
          }))
        );
      }
    }
  }

  return await Promise.all(statsPromises);
}

type FetchAttributeStatsOptions = {
  attribute: string;
  dataset: Dataset;
  options: FetchStatsOptions;
  maxNumberOfCategories?: number;
};

async function fetchAttributeStats({
  attribute,
  dataset,
  options,
  maxNumberOfCategories = 1000,
}: FetchAttributeStatsOptions) {
  const {connectionName, source, type, queryParameters} = dataset;
  const {apiBaseUrl, accessToken, headers, maxLengthURL} = options;
  const baseUrl = buildStatsUrl({attribute, apiBaseUrl, ...dataset});
  const errorContext: APIErrorContext = {
    requestType: 'Tile stats',
    connection: connectionName,
    type,
    source,
  };

  const parameters: Record<string, string | number> = {maxNumberOfCategories};

  if (type === 'query') {
    parameters.q = source;
    if (queryParameters) {
      parameters.queryParameters = JSON.stringify(queryParameters);
    }
  }

  return await requestWithParameters({
    baseUrl,
    headers: {Authorization: `Bearer ${accessToken}`, ...headers},
    parameters,
    errorContext,
    maxLengthURL,
  });
}
