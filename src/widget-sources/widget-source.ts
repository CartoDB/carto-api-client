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
import {FilterLogicalOperator, Filter, Filters} from '../types.js';
import {getApplicableFilters} from '../utils.js';
import {getClient} from '../client.js';
import {ModelSource} from '../models/model.js';
import {SourceOptions} from '../sources/index.js';
import {ApiVersion, DEFAULT_API_BASE_URL} from '../constants.js';

export interface WidgetSourceProps extends Omit<SourceOptions, 'filters'> {
  apiVersion?: ApiVersion;
  filters?: Record<string, Filter>;
  filtersLogicalOperator?: FilterLogicalOperator;
}

/**
 * Source for Widget API requests on a data source defined by a SQL query.
 *
 * Abstract class. Use {@link WidgetQuerySource} or {@link WidgetTableSource}.
 */
export abstract class WidgetSource<Props extends WidgetSourceProps> {
  readonly props: Props;

  static defaultProps: Partial<WidgetSourceProps> = {
    apiVersion: ApiVersion.V3,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    clientId: getClient(),
    filters: {},
    filtersLogicalOperator: 'and',
  };

  constructor(props: Props) {
    this.props = {
      ...WidgetSource.defaultProps,
      clientId: getClient(), // Refresh clientId, default may have changed.
      ...props,
    };
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
    };
  }

  /**
   * Returns a list of labeled datapoints for categorical data. Suitable for
   * charts including grouped bar charts, pie charts, and tree charts.
   */
  abstract getCategories(
    options: CategoryRequestOptions
  ): Promise<CategoryResponse>;

  /**
   * Given a list of feature IDs (as found in `_carto_feature_id`) returns all
   * matching features. In datasets containing features with duplicate geometries,
   * feature IDs may be duplicated (IDs are a hash of geometry) and so more
   * results may be returned than IDs in the request.
   * @internal
   * @experimental
   */
  abstract getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse>;

  /**
   * Returns a scalar numerical statistic over all matching data. Suitable
   * for 'headline' or 'scorecard' figures such as counts and sums.
   */
  abstract getFormula(options: FormulaRequestOptions): Promise<FormulaResponse>;

  /**
   * Returns a list of labeled datapoints for 'bins' of data defined as ticks
   * over a numerical range. Suitable for histogram charts.
   */
  abstract getHistogram(
    options: HistogramRequestOptions
  ): Promise<HistogramResponse>;

  /**
   * Returns a range (min and max) for a numerical column of matching rows.
   * Suitable for displaying certain 'headline' or 'scorecard' statistics,
   * or rendering a range slider UI for filtering.
   */
  abstract getRange(options: RangeRequestOptions): Promise<RangeResponse>;

  /**
   * Returns a list of bivariate datapoints defined as numerical 'x' and 'y'
   * values. Suitable for rendering scatter plots.
   */
  abstract getScatter(options: ScatterRequestOptions): Promise<ScatterResponse>;

  /**
   * Returns a list of arbitrary data rows, with support for pagination and
   * sorting. Suitable for displaying tables and lists.
   */
  abstract getTable(options: TableRequestOptions): Promise<TableResponse>;

  /**
   * Returns a series of labeled numerical values, grouped into equally-sized
   * time intervals. Suitable for rendering time series charts.
   */
  abstract getTimeSeries(
    options: TimeSeriesRequestOptions
  ): Promise<TimeSeriesResponse>;
}

/**
 * @todo TODO(v0.5): Remove WidgetBaseSourceProps alias
 * @deprecated Use WidgetSourceProps.
 */
export type WidgetBaseSourceProps = WidgetSourceProps;

/**
 * @todo TODO(v0.5): Remove WidgetBaseSource alias.
 * @deprecated Use WidgetSourceP.
 */
export const WidgetBaseSource = WidgetSource;
