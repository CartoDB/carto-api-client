import {executeModel} from '../vendor/carto-react-api.js';
import {
  formatResult,
  normalizeObjectKeys,
} from '../vendor/carto-react-widgets.js';
import {$TODO} from '../types.js';
import {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_CLIENT,
  MAP_TYPES,
} from '../vendor/carto-constants.js';
import {SourceOptions} from '@deck.gl/carto';
import {getWidgetFilters} from '../utils.js';
import {Filter} from '../vendor/deck-carto.js';

/**
 *
 */
export interface BaseWidgetSourceProps extends SourceOptions {
  id?: string;
  type?: MAP_TYPES;
  credentials: {
    apiVersion: API_VERSIONS;
    accessToken: string;
  };
  connection: string;
  filtersLogicalOperator?: 'and' | 'or';
  queryParameters?: unknown[];
  geoColumn?: string;
  provider?: string;
  filters: Record<string, Filter>;
}

export class BaseWidgetSource<Props extends BaseWidgetSourceProps> {
  readonly props: Props;
  readonly credentials: {
    apiBaseUrl: string;
    apiVersion: API_VERSIONS;
    accessToken: string;
    clientId: string;
  };
  readonly connectionName: string;

  static defaultProps: Partial<BaseWidgetSourceProps> = {
    filters: {},
    filtersLogicalOperator: 'and',
  };

  constructor(props: Props) {
    this.props = {...BaseWidgetSource.defaultProps, ...props};
    this.credentials = {
      apiVersion: API_VERSIONS.V3,
      apiBaseUrl: DEFAULT_API_BASE_URL || props.apiBaseUrl,
      clientId: DEFAULT_CLIENT || props.clientId,
      accessToken: props.accessToken,
    };
    this.connectionName = props.connectionName;
  }
  protected getSource(owner: string): $TODO {
    return {
      ...(this.props as any),
      filters: getWidgetFilters(owner, (this.props as any).filters),
      credentials: this.credentials,
      connection: this.connectionName,
    };
  }
  getFormula(props: $TODO): $TODO {
    const {owner, spatialFilter, abortController, operationExp, ...params} =
      props;
    const {column, operation} = params;
    return executeModel({
      model: 'formula',
      source: this.getSource(owner),
      spatialFilter: spatialFilter,
      params: {column: column ?? '*', operation, operationExp},
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows[0]));
  }
  getCategories(props: $TODO): $TODO {
    const {owner, spatialFilter, abortController, ...params} = props;
    const {column, operation, operationColumn} = params;

    return executeModel({
      model: 'category',
      source: this.getSource(owner),
      spatialFilter: spatialFilter,
      params: {
        column,
        operation,
        operationColumn: operationColumn || column,
      },
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows));
  }
  getRange(props: $TODO): $TODO {
    const {owner, spatialFilter, abortController, ...params} = props;
    const {column} = params;

    return executeModel({
      model: 'range',
      source: this.getSource(owner),
      spatialFilter: spatialFilter,
      params: {column},
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows[0]));
  }
  getTable(props: $TODO): $TODO {
    const {owner, spatialFilter, abortController, ...params} = props;
    const {columns, sortBy, sortDirection, page, rowsPerPage} = params;

    return executeModel({
      model: 'table',
      source: this.getSource(owner),
      spatialFilter: spatialFilter,
      params: {
        column: columns,
        sortBy,
        sortDirection,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      },
      opts: {abortController},
    })
      .then((res: $TODO) => ({
        rows: normalizeObjectKeys(res.rows),
        totalCount: res.metadata.total,
      }))
      .then(formatResult);
  }
  getScatter() {
    throw new Error('TODO: implement');
  }
  getTimeSeries() {
    throw new Error('TODO: implement');
  }
  getHistogram() {
    throw new Error('TODO: implement');
  }
}
