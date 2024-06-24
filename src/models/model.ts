import {getClient} from '../client';
import {ApiVersion, MapType} from '../constants';
import {
  DEFAULT_GEO_COLUMN,
  REQUEST_GET_MAX_URL_LENGTH,
} from '../constants-internal';
import {Source, SpatialFilter} from '../types';
import {assert} from '../utils';
import {ModelRequestOptions, checkCredentials, makeCall} from './common';

/** @internalRemarks Source: @carto/react-api */
const AVAILABLE_MODELS = [
  'category',
  'histogram',
  'formula',
  'timeseries',
  'range',
  'scatterplot',
  'table',
] as const;

export type Model = (typeof AVAILABLE_MODELS)[number];

/**
 * Execute a SQL model request.
 * @internalRemarks Source: @carto/react-api
 */
export function executeModel(props: {
  model: Model;
  source: Source;
  params: Record<string, unknown>;
  spatialFilter?: SpatialFilter;
  opts?: Partial<ModelRequestOptions>;
}) {
  assert(props.source, 'executeModel: missing source');
  assert(props.model, 'executeModel: missing model');
  assert(props.params, 'executeModel: missing params');

  assert(
    AVAILABLE_MODELS.indexOf(props.model) !== -1,
    `executeModel: model provided isn't valid. Available models: ${AVAILABLE_MODELS.join(
      ', '
    )}`
  );

  const {source, model, params, spatialFilter, opts} = props;

  checkCredentials(source.credentials);

  assert(
    source.credentials.apiVersion === ApiVersion.V3,
    'SQL Model API is a feature only available in CARTO 3.'
  );
  assert(
    source.type !== MapType.TILESET,
    'executeModel: Tileset not supported'
  );

  let url = `${source.credentials.apiBaseUrl}/v3/sql/${source.connection}/model/${model}`;

  const {filters, filtersLogicalOperator = 'and', data, type} = source;
  const queryParameters = source.queryParameters
    ? JSON.stringify(source.queryParameters)
    : '';

  const queryParams: Record<string, string> = {
    type,
    client: getClient(),
    source: data,
    params: JSON.stringify(params),
    queryParameters,
    filters: JSON.stringify(filters),
    filtersLogicalOperator,
  };

  // API supports multiple filters, we apply it only to geoColumn
  const spatialFilters = spatialFilter
    ? {
        [source.geoColumn ? source.geoColumn : DEFAULT_GEO_COLUMN]:
          spatialFilter,
      }
    : undefined;

  if (spatialFilters) {
    queryParams.spatialFilters = JSON.stringify(spatialFilters);
  }

  const urlWithSearchParams =
    url + '?' + new URLSearchParams(queryParams).toString();
  const isGet = urlWithSearchParams.length <= REQUEST_GET_MAX_URL_LENGTH;
  if (isGet) {
    url = urlWithSearchParams;
  } else {
    // undo the JSON.stringify, @TODO find a better pattern
    queryParams.params = params as any;
    queryParams.filters = filters as any;
    queryParams.queryParameters = source.queryParameters as any;
    if (spatialFilters) {
      queryParams.spatialFilters = spatialFilters as any;
    }
  }
  return makeCall({
    url,
    credentials: source.credentials,
    opts: {
      ...opts,
      method: isGet ? 'GET' : 'POST',
      ...(!isGet && {body: JSON.stringify(queryParams)}),
    },
  });
}
