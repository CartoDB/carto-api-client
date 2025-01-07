import {html, nothing} from 'lit';
import {Task, TaskStatus} from '@lit/task';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {cache} from 'lit/directives/cache.js';
import * as echarts from 'echarts';
import {Filter, FilterType, addFilter, removeFilter} from '@carto/api-client';

import {DEFAULT_PALETTE, DEFAULT_TEXT_STYLE} from './styles.js';
import {DEBOUNCE_TIME_MS} from '../constants.js';
import {sleep} from '../utils.js';
import {BaseWidget} from './base-widget.js';

const DEFAULT_CATEGORY_GRID = {
  left: 0,
  right: '4px',
  top: '8px',
  bottom: '24px',
  width: 'auto',
  height: 'auto',
};

export class CategoryWidget extends BaseWidget {
  static get properties() {
    return {
      ...super.properties,
      operation: {type: String},
      column: {type: String},
      _filterValues: {state: true},
    };
  }

  declare column: string;
  declare operation: 'count' | 'avg' | 'min' | 'max' | 'sum';

  protected _chart: echarts.ECharts | null = null;
  protected _chartRef: Ref<HTMLElement> = createRef();
  declare protected _filterValues: string[];

  constructor() {
    super();
    this.operation = 'count';
    this.column = '';
    this._filterValues = [];
  }

  protected _task = new Task(this, {
    task: async ([data, operation, column], {signal}) => {
      if (!data) return [];

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;

      return await widgetSource.getCategories({
        filterOwner: this._widgetId,
        spatialFilter: this.getSpatialFilterOrViewState(),
        operation,
        column,
        spatialIndexReferenceViewState: this.viewState ?? undefined,
      });
    },
    args: () =>
      [
        this.data,
        this.operation,
        this.column,
        this.viewState,
        this.spatialFilter,
      ] as const,
  });

  override render() {
    return this._task.render({
      pending: () =>
        cache(
          html`<h3>${this.header}</h3>
            <figure>
              <div class="chart chart-skeleton"></div>
              <figcaption>${this.caption}</figcaption>
            </figure>`
        ),
      complete: () =>
        cache(html`
          <h3>${this.header}</h3>
          <figure>
            <div class="chart" ${ref(this._chartRef)}></div>
            <figcaption>${this.caption}</figcaption>
          </figure>
          <button
            class="clear-btn"
            @click=${this._clearFilter}
            disabled=${this._filterValues.length > 0 ? nothing : true}
          >
            Clear
          </button>
        `),
      error: (e) =>
        html`<h3>${this.header}</h3>
          <p>Error: ${e}</p>`,
    });
  }

  override updated() {
    if (this._task.status !== TaskStatus.COMPLETE) return;

    if (!this._chart || this._chart.getDom() !== this._chartRef.value) {
      this._chart = echarts.init(this._chartRef.value!, null, {height: 200});
      this._chart.on('click', ({name}) => this._toggleFilter(name));
    }

    // TODO: If another widget overrides this widget's filters, what happens?

    this._updateChart();
  }

  private _toggleFilter(value: string): void {
    if (this._filterValues.includes(value)) {
      this._filterValues = this._filterValues.filter((v) => v !== value);
    } else {
      this._filterValues = [...this._filterValues, value];
    }
    this._dispatchFilter();
  }

  private _clearFilter(): void {
    this._filterValues = [];
    this._dispatchFilter();
  }

  private async _dispatchFilter(): Promise<void> {
    if (!this.data) return;

    const {widgetSource} = await this.data;
    const filters = {...widgetSource.props.filters} as Record<string, Filter>;
    const column = this.column as string;

    if (this._filterValues.length > 0) {
      addFilter(filters, {
        column,
        type: FilterType.IN,
        values: Array.from(this._filterValues),
        owner: this._widgetId,
      });
    } else {
      removeFilter(filters, {column, owner: this._widgetId});
    }

    this.dispatchEvent(new CustomEvent('filter', {detail: {filters}}));
  }

  protected async _updateChart() {
    if (this._task.status === TaskStatus.ERROR) {
      return;
    }

    const categories = await this._task.taskComplete;
    categories.sort((a, b) => (a.value > b.value ? -1 : 1));

    const data = categories.map(({name, value}, index) => {
      let color = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
      if (this._filterValues.length > 0) {
        color = this._filterValues.includes(name) ? color : '#cccccc';
      }
      return {value, name, itemStyle: {color}};
    });

    this._chart!.setOption({
      xAxis: {data: data.map(({name}) => name)},
      yAxis: {type: 'value'},
      series: [{type: 'bar', name: this.header, data}],
      // Confine tooltip to the chart bounds, so it doesn't clip at sidebar scroll rect.
      tooltip: {confine: true},
      grid: DEFAULT_CATEGORY_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}
