import {executeModel} from './vendor/carto-react-api.js';
import {
  formatResult,
  normalizeObjectKeys,
} from './vendor/carto-react-widgets.js';
import {$TODO, DataView} from './types.js';
import {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_CLIENT,
  MAP_TYPES,
} from './vendor/carto-constants.js';
import {
  SourceOptions,
  VectorQuerySourceOptions,
  VectorTableSourceOptions,
} from '@deck.gl/carto';
import {getWidgetFilters} from './utils.js';

// TODO: types
const DEFAULT_PROPS: any = {
  filters: {},
  filtersLogicalOperator: 'and',
};

export class CartoDataView<Props extends SourceOptions> implements DataView {
  readonly props: Props;
  readonly credentials: {
    apiBaseUrl: string;
    apiVersion: API_VERSIONS;
    accessToken: string;
    clientId: string;
  };
  readonly connectionName: string;

  constructor(props: Props) {
    this.props = {...DEFAULT_PROPS, ...props};
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

export class TableDataView extends CartoDataView<VectorTableSourceOptions> {
  protected override getSource(owner: string): $TODO {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.TABLE,
      data: this.props.tableName,
    };
  }
}

export class QueryDataView extends CartoDataView<VectorQuerySourceOptions> {
  protected override getSource(owner: string): $TODO {
    return {
      ...super.getSource(owner),
      type: MAP_TYPES.QUERY,
      data: this.props.sqlQuery,
    };
  }
}
