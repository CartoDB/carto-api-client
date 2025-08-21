import type {
  AggregationsRequestOptions,
  AggregationsResponse,
  CategoryRequestOptions,
  CategoryResponse,
  ExtentRequestOptions,
  ExtentResponse,
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
import type {FilterLogicalOperator, Filter} from '../types.js';
import {getClient} from '../client.js';
import type {SourceOptions} from '../sources/index.js';
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
export abstract class WidgetSource<
  Props extends WidgetSourceProps = WidgetSourceProps,
> {
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
   * Destroys the widget source and releases allocated resources.
   *
   * For remote sources (tables, queries) this has no effect, but for local
   * sources (tilesets, rasters) these resources will affect performance
   * and stability if many (10+) sources are created and not released.
   */
  destroy() {
    // no-op in most cases, but required for worker sources.
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

  /**
   * Returns multiple aggregated values computed over matching data. Suitable
   * for aggregated statistics from pivoted tables, such as H3 tables with
   * pre-computed aggregations across multiple columns.
   */
  abstract getAggregations(
    options: AggregationsRequestOptions
  ): Promise<AggregationsResponse>;

  /** @experimental */
  abstract getExtent(options?: ExtentRequestOptions): Promise<ExtentResponse>;
}
