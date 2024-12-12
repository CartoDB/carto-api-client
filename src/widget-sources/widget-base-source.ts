import {executeModel} from '../models/index.js';
import {
  CategoryRequestOptions,
  CategoryResponse,
  FeaturesRequestOptions,
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
  ViewState,
} from './types.js';
import {FilterLogicalOperator, Filter} from '../types.js';
import {assert, getApplicableFilters, normalizeObjectKeys} from '../utils.js';
import {getClient} from '../client.js';
import {ModelSource} from '../models/model.js';
import {SourceOptions} from '../sources/index.js';
import {ApiVersion, DEFAULT_API_BASE_URL} from '../constants.js';
import {
  DEFAULT_GEO_COLUMN,
  DEFAULT_TILE_RESOLUTION,
} from '../constants-internal.js';
import {getSpatialFiltersResolution} from '../spatial-index.js';
import {AggregationOptions} from '../sources/types.js';

export interface WidgetBaseSourceProps extends Omit<SourceOptions, 'filters'> {
  apiVersion?: ApiVersion;
  filters?: Record<string, Filter>;
  filtersLogicalOperator?: FilterLogicalOperator;
}

export type WidgetSource = WidgetBaseSource<WidgetBaseSourceProps>;

/**
 * Source for Widget API requests on a data source defined by a SQL query.
 *
 * Abstract class. Use {@link WidgetQuerySource} or {@link WidgetTableSource}.
 */
export abstract class WidgetBaseSource<Props extends WidgetBaseSourceProps> {
  readonly props: Props;

  static defaultProps: Partial<WidgetBaseSourceProps> = {
    apiVersion: ApiVersion.V3,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    clientId: getClient(),
    filters: {},
    filtersLogicalOperator: 'and',
  };

  constructor(props: Props) {
    this.props = {...WidgetBaseSource.defaultProps, ...props};
  }

  /**
   * Subclasses of {@link WidgetBaseSource} must implement this method, calling
   * {@link WidgetBaseSource.prototype._getModelSource} for common source
   * properties, and adding additional required properties including 'type' and
   * 'data'.
   */
  protected abstract getModelSource(owner: string | undefined): ModelSource;

  protected _getModelSource(
    owner?: string
  ): Omit<ModelSource, 'type' | 'data'> {
    const props = this.props;
    return {
      apiVersion: props.apiVersion as ApiVersion,
      apiBaseUrl: props.apiBaseUrl as string,
      clientId: props.clientId as string,
      accessToken: props.accessToken,
      connectionName: props.connectionName,
      filters: getApplicableFilters(owner, props.filters),
      filtersLogicalOperator: props.filtersLogicalOperator,
      spatialDataType: props.spatialDataType,
      spatialDataColumn: props.spatialDataColumn,
      dataResolution: (props as Partial<AggregationOptions>).dataResolution,
    };
  }

  /****************************************************************************
   * CATEGORIES
   */

  /**
   * Returns a list of labeled datapoints for categorical data. Suitable for
   * charts including grouped bar charts, pie charts, and tree charts.
   */
  async getCategories(
    options: CategoryRequestOptions
  ): Promise<CategoryResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      viewState,
      ...params
    } = options;
    const {column, operation, operationColumn} = params;
    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type CategoriesModelResponse = {rows: {name: string; value: number}[]};

    return executeModel({
      model: 'category',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column,
        operation,
        operationColumn: operationColumn || column,
      },
      opts: {abortController},
    }).then((res: CategoriesModelResponse) => normalizeObjectKeys(res.rows));
  }

  /****************************************************************************
   * FEATURES
   */

  /**
   * Given a list of feature IDs (as found in `_carto_feature_id`) returns all
   * matching features. In datasets containing features with duplicate geometries,
   * feature IDs may be duplicated (IDs are a hash of geometry) and so more
   * results may be returned than IDs in the request.
   * @internal
   * @experimental
   */
  async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      viewState,
      ...params
    } = options;
    const {columns, dataType, featureIds, z, limit, tileResolution} = params;
    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type FeaturesModelResponse = {rows: Record<string, unknown>[]};

    return executeModel({
      model: 'pick',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        columns,
        dataType,
        featureIds,
        z,
        limit: limit || 1000,
        tileResolution: tileResolution || DEFAULT_TILE_RESOLUTION,
      },
      opts: {abortController},
    }).then((res: FeaturesModelResponse) => ({
      rows: normalizeObjectKeys(res.rows),
    }));
  }

  /****************************************************************************
   * FORMULA
   */

  /**
   * Returns a scalar numerical statistic over all matching data. Suitable
   * for 'headline' or 'scorecard' figures such as counts and sums.
   */
  async getFormula(options: FormulaRequestOptions): Promise<FormulaResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      operationExp,
      viewState,
      ...params
    } = options;
    const {column, operation} = params;
    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type FormulaModelResponse = {rows: {value: number}[]};

    return executeModel({
      model: 'formula',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {column: column ?? '*', operation, operationExp},
      opts: {abortController},
    }).then((res: FormulaModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  /****************************************************************************
   * HISTOGRAM
   */

  /**
   * Returns a list of labeled datapoints for 'bins' of data defined as ticks
   * over a numerical range. Suitable for histogram charts.
   */
  async getHistogram(
    options: HistogramRequestOptions
  ): Promise<HistogramResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      viewState,
      ...params
    } = options;
    const {column, operation, ticks} = params;
    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type HistogramModelResponse = {rows: {tick: number; value: number}[]};

    const data = await executeModel({
      model: 'histogram',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {column, operation, ticks},
      opts: {abortController},
    }).then((res: HistogramModelResponse) => normalizeObjectKeys(res.rows));

    if (data.length) {
      // Given N ticks the API returns up to N+1 bins, omitting any empty bins. Bins
      // include 1 bin below the lowest tick, N-1 between ticks, and 1 bin above the highest tick.
      const result = Array(ticks.length + 1).fill(0);
      data.forEach(
        ({tick, value}: {tick: number; value: number}) => (result[tick] = value)
      );
      return result;
    }

    return [];
  }

  /****************************************************************************
   * RANGE
   */

  /**
   * Returns a range (min and max) for a numerical column of matching rows.
   * Suitable for displaying certain 'headline' or 'scorecard' statistics,
   * or rendering a range slider UI for filtering.
   */
  async getRange(options: RangeRequestOptions): Promise<RangeResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      viewState,
      ...params
    } = options;
    const {column} = params;
    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type RangeModelResponse = {rows: {min: number; max: number}[]};

    return executeModel({
      model: 'range',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {column},
      opts: {abortController},
    }).then((res: RangeModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  /****************************************************************************
   * SCATTER
   */

  /**
   * Returns a list of bivariate datapoints defined as numerical 'x' and 'y'
   * values. Suitable for rendering scatter plots.
   */
  async getScatter(options: ScatterRequestOptions): Promise<ScatterResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      viewState,
      ...params
    } = options;
    const {xAxisColumn, xAxisJoinOperation, yAxisColumn, yAxisJoinOperation} =
      params;

    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    // Make sure this is sync with the same constant in cloud-native/maps-api
    const HARD_LIMIT = 500;

    type ScatterModelResponse = {rows: {x: number; y: number}[]};

    return executeModel({
      model: 'scatterplot',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        xAxisColumn,
        xAxisJoinOperation,
        yAxisColumn,
        yAxisJoinOperation,
        limit: HARD_LIMIT,
      },
      opts: {abortController},
    })
      .then((res: ScatterModelResponse) => normalizeObjectKeys(res.rows))
      .then((res) => res.map(({x, y}: {x: number; y: number}) => [x, y]));
  }

  /****************************************************************************
   * TABLE
   */

  /**
   * Returns a list of arbitrary data rows, with support for pagination and
   * sorting. Suitable for displaying tables and lists.
   */
  async getTable(options: TableRequestOptions): Promise<TableResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      abortController,
      viewState,
      ...params
    } = options;
    const {columns, sortBy, sortDirection, offset = 0, limit = 10} = params;
    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type TableModelResponse = {
      rows: Record<string, number | string>[];
      metadata: {total: number};
    };

    return executeModel({
      model: 'table',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column: columns,
        sortBy,
        sortDirection,
        limit,
        offset,
      },
      opts: {abortController},
    }).then((res: TableModelResponse) => ({
      // Avoid `normalizeObjectKeys()`, which changes column names.
      rows: res.rows ?? (res as any).ROWS,
      totalCount: res.metadata?.total ?? (res as any).METADATA?.TOTAL,
    }));
  }

  /****************************************************************************
   * TIME SERIES
   */

  /**
   * Returns a series of labeled numerical values, grouped into equally-sized
   * time intervals. Suitable for rendering time series charts.
   */
  async getTimeSeries(
    options: TimeSeriesRequestOptions
  ): Promise<TimeSeriesResponse> {
    const {
      filterOwner,
      abortController,
      spatialFilter,
      spatialFiltersMode,
      viewState,
      ...params
    } = options;
    const {
      column,
      operationColumn,
      joinOperation,
      operation,
      stepSize,
      stepMultiplier,
      splitByCategory,
      splitByCategoryLimit,
      splitByCategoryValues,
    } = params;

    const source = this.getModelSource(filterOwner);

    let spatialFiltersResolution: number | undefined;
    if (spatialFilter && source.spatialDataType !== 'geo') {
      spatialFiltersResolution = getSpatialFiltersResolution({
        source,
        viewState,
      });
    }

    type TimeSeriesModelResponse = {
      rows: {name: string; value: number}[];
      metadata: {categories: string[]};
    };

    return executeModel({
      model: 'timeseries',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column,
        stepSize,
        stepMultiplier,
        operationColumn: operationColumn || column,
        joinOperation,
        operation,
        splitByCategory,
        splitByCategoryLimit,
        splitByCategoryValues,
      },
      opts: {abortController},
    }).then((res: TimeSeriesModelResponse) => ({
      rows: normalizeObjectKeys(res.rows),
      categories: res.metadata?.categories,
    }));
  }
}
