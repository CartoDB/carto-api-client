import {executeModel, ModelSource} from '../models/index.js';
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
} from './types.js';
import {getApplicableFilters, normalizeObjectKeys} from '../utils.js';
import {DEFAULT_TILE_RESOLUTION} from '../constants-internal.js';
import {WidgetSource, WidgetSourceProps} from './widget-source.js';
import {Filters} from '../types.js';
import {ApiVersion} from '../constants.js';
import {AggregationOptions} from '../sources/types.js';

export type WidgetRemoteSourceProps = WidgetSourceProps;

/**
 * Source for Widget API requests.
 *
 * Abstract class. Use {@link WidgetQuerySource} or {@link WidgetTableSource}.
 */
export abstract class WidgetRemoteSource<
  Props extends WidgetRemoteSourceProps,
> extends WidgetSource<Props> {
  protected _headers: Record<string, string> = {};

  /** Assigns HTTP headers to be included on API requests from this source. */
  setRequestHeaders(headers: Record<string, string>): void {
    this._headers = headers;
  }

  /**
   * Subclasses of {@link WidgetRemoteSource} must implement this method, calling
   * {@link WidgetRemoteSource.prototype._getModelSource} for common source
   * properties, and adding additional required properties including 'type' and
   * 'data'.
   */
  protected abstract getModelSource(
    filters: Filters | undefined,
    filterOwner?: string
  ): ModelSource;

  protected _getModelSource(
    filters: Filters | undefined,
    filterOwner?: string
  ): Omit<ModelSource, 'type' | 'data'> {
    const props = this.props;
    return {
      apiVersion: props.apiVersion as ApiVersion,
      apiBaseUrl: props.apiBaseUrl as string,
      clientId: props.clientId as string,
      accessToken: props.accessToken,
      connectionName: props.connectionName,
      filters: getApplicableFilters(filterOwner, filters || props.filters),
      filtersLogicalOperator: props.filtersLogicalOperator,
      spatialDataType: props.spatialDataType,
      spatialDataColumn: props.spatialDataColumn,
      dataResolution: (props as Partial<AggregationOptions>).dataResolution,
    };
  }

  async getCategories(
    options: CategoryRequestOptions
  ): Promise<CategoryResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {column, operation, operationColumn} = params;
    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
    }).then((res: CategoriesModelResponse) => normalizeObjectKeys(res.rows));
  }

  async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {columns, dataType, featureIds, z, limit, tileResolution} = params;
    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
      // Avoid `normalizeObjectKeys()`, which changes column names.
    }).then(({rows}: FeaturesModelResponse) => ({rows}));
  }

  async getFormula(options: FormulaRequestOptions): Promise<FormulaResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      operationExp,
      ...params
    } = options;
    const {column, operation} = params;
    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type FormulaModelResponse = {rows: {value: number}[]};

    return executeModel({
      model: 'formula',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column: column ?? '*',
        operation: operation ?? 'count',
        operationExp,
      },
      opts: {abortController, headers: this._headers},
    }).then((res: FormulaModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getHistogram(
    options: HistogramRequestOptions
  ): Promise<HistogramResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {column, operation, ticks} = params;
    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
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

  async getRange(options: RangeRequestOptions): Promise<RangeResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {column} = params;
    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
    }).then((res: RangeModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getScatter(options: ScatterRequestOptions): Promise<ScatterResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {xAxisColumn, xAxisJoinOperation, yAxisColumn, yAxisJoinOperation} =
      params;

    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
    })
      .then((res: ScatterModelResponse) => normalizeObjectKeys(res.rows))
      .then((res) => res.map(({x, y}: {x: number; y: number}) => [x, y]));
  }

  async getTable(options: TableRequestOptions): Promise<TableResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {columns, sortBy, sortDirection, offset = 0, limit = 10} = params;
    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
    }).then((res: TableModelResponse) => ({
      // Avoid `normalizeObjectKeys()`, which changes column names.
      rows: res.rows ?? (res as any).ROWS,
      totalCount: res.metadata?.total ?? (res as any).METADATA?.TOTAL,
    }));
  }

  async getTimeSeries(
    options: TimeSeriesRequestOptions
  ): Promise<TimeSeriesResponse> {
    const {
      filters = this.props.filters,
      filterOwner,
      abortController,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
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

    const source = this.getModelSource(filters, filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

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
      opts: {abortController, headers: this._headers},
    }).then((res: TimeSeriesModelResponse) => ({
      rows: normalizeObjectKeys(res.rows),
      categories: res.metadata?.categories,
    }));
  }
}
