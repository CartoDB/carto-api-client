import {LitElement, html, nothing} from 'lit';
import {Task} from '@lit/task';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {DEBOUNCE_TIME_MS} from '../constants';
import {getSpatialFilter, sleep} from '../utils';
import * as echarts from 'echarts';
import {TaskStatus} from '@lit/task';
import {DEFAULT_PALETTE, DEFAULT_TEXT_STYLE, WIDGET_BASE_CSS} from './styles';
import {cache} from 'lit/directives/cache.js';
import {AggregationTypes} from '../vendor/carto-constants';
import {WidgetSource} from '../sources/index.js';
import {MapViewState} from '@deck.gl/core';

const DEFAULT_CATEGORY_GRID = {
  left: 0,
  right: '4px',
  top: '8px',
  bottom: '24px',
  width: 'auto',
  height: 'auto',
};

@customElement('category-widget')
export class CategoryWidget extends LitElement {
  static override styles = WIDGET_BASE_CSS;

  @property()
  header = 'Untitled';

  @property()
  caption = 'Scatter widget';

  @property({type: Object, attribute: false})
  data: Promise<{widgetSource: WidgetSource}> | null = null;

  @property({type: AggregationTypes})
  operation = AggregationTypes.COUNT;

  @property({type: String})
  column = '';

  @property({type: Object, attribute: false})
  viewState: MapViewState | null = null;

  protected readonly widgetId = crypto.randomUUID();
  protected chart: echarts.ECharts | null = null;
  protected chartRef: Ref<HTMLElement> = createRef();

  @state()
  protected filterValues: string[] = [];

  protected _task = new Task(this, {
    task: async ([data, operation, column, viewState], {signal}) => {
      if (!data) return [];

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;
      const spatialFilter = viewState ? getSpatialFilter(viewState) : undefined;

      return await widgetSource.getCategories({
        filterOwner: this.widgetId,
        operation,
        column,
        spatialFilter,
      }); // TODO: signal
    },
    args: () =>
      [this.data, this.operation, this.column, this.viewState] as const,
  });

  override render() {
    return this._task.render({
      pending: () =>
        cache(html`<h3>${this.header}</h3>
          <figure>
            <div class="chart chart-skeleton"></div>
            <figcaption>${this.caption}</figcaption>
          </figure>`),
      complete: () =>
        cache(html`
          <h3>${this.header}</h3>
          <figure>
            <div class="chart" ${ref(this.chartRef)}></div>
            <figcaption>${this.caption}</figcaption>
          </figure>
          <button
            class="clear-btn"
            @click=${this._clearFilter}
            disabled=${this.filterValues.length > 0 ? nothing : true}
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

    if (!this.chart || this.chart.getDom() !== this.chartRef.value) {
      this.chart = echarts.init(this.chartRef.value!, null, {height: 200});
      this.chart.on('click', ({name}) => this._toggleFilter(name));
    }

    // TODO: If another widget overrides this widget's filters, what happens?

    this._updateChart();
  }

  private _toggleFilter(value: string): void {
    if (this.filterValues.includes(value)) {
      this.filterValues = this.filterValues.filter((v) => v !== value);
    } else {
      this.filterValues = [...this.filterValues, value];
    }
    this._dispatchFilter();
  }

  private _clearFilter(): void {
    this.filterValues = [];
    this._dispatchFilter();
  }

  private async _dispatchFilter(): Promise<void> {
    if (!this.data) return;

    const {widgetSource} = await this.data;
    const filters = {...widgetSource.props.filters} as Record<string, unknown>;
    const column = this.column as string;

    // TODO: Append filters from multiple widgets on the same columns.
    if (this.filterValues.length > 0) {
      filters[column] = {
        in: {
          owner: this.widgetId,
          values: Array.from(this.filterValues),
        },
      };
    } else {
      delete filters[column];
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
      let color = DEFAULT_PALETTE[index]; // TODO: >8 categories allowed?
      if (this.filterValues.length > 0) {
        color = this.filterValues.includes(name) ? color : '#cccccc';
      }
      return {value, name, itemStyle: {color}};
    });

    this.chart!.setOption({
      xAxis: {data: data.map(({name}) => name)},
      yAxis: {type: 'value'},
      series: [{type: 'bar', name: this.header, data}],
      tooltip: {},
      grid: DEFAULT_CATEGORY_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}
