import {LitElement, html, nothing} from 'lit';
import {Task} from '@lit/task';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {DEBOUNCE_TIME_MS} from '../constants';
import {getSpatialFilter, getWidgetFilters, sleep} from '../utils';
import * as echarts from 'echarts';
import {TaskStatus} from '@lit/task';
import {
  DEFAULT_CATEGORY_GRID,
  DEFAULT_PALETTE,
  DEFAULT_TEXT_STYLE,
  WIDGET_BASE_CSS,
} from './styles';
import {cache} from 'lit/directives/cache.js';

type Category = {name: string; value: number};

@customElement('category-widget')
export class CategoryWidget extends LitElement {
  static override styles = WIDGET_BASE_CSS;

  @property()
  header = 'Untitled';

  @property()
  caption = 'Category widget';

  @property({type: Object, attribute: false}) // TODO: types
  data = null;

  @property({type: Object, attribute: false}) // TODO: types
  config = null;

  @property({type: Object, attribute: false}) // TODO: types
  viewState = null;

  protected readonly widgetId = crypto.randomUUID();
  protected chart: echarts.ECharts | null = null;
  protected chartRef: Ref<HTMLElement> = createRef();

  @state()
  protected filterValues: string[] = [];

  protected _categoryTask = new Task(this, {
    task: async ([data, config, viewState], {signal}) => {
      if (!data) return [];

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {dataView} = await data;
      const filters = getWidgetFilters(this.widgetId, config.source.filters);
      const source = {...config.source, filters};
      const spatialFilter = viewState ? getSpatialFilter(viewState) : undefined;
      return (await dataView.getCategories({...config, source, spatialFilter})) as Category[]; // TODO: signal
    },
    args: () => [this.data, this.config, this.viewState],
  });

  override render() {
    return this._categoryTask.render({
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
    if (this._categoryTask.status !== TaskStatus.COMPLETE) return;

    if (!this.chart || this.chart.getDom() !== this.chartRef.value) {
      this.chart = echarts.init(this.chartRef.value!, null, {height: 200});
      this.chart.on('click', ({name}) => this._toggleFilter(name));
    }

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

  private _dispatchFilter(): void {
    const filters = {...this.config.filters} as Record<string, unknown>;
    const column = this.config.column as string;

    if (this.filterValues.length > 0) {
      filters[column] = {
        in: {
          owner: this.widgetId,
          values: Array.from(this.filterValues),
        },
      };
    }

    this.dispatchEvent(new CustomEvent('filter', {detail: {filters}}));
  }

  protected async _updateChart() {
    if (this._categoryTask.status === TaskStatus.ERROR) {
      return;
    }

    const categories = await this._categoryTask.taskComplete;
    categories.sort((a, b) => (a.value > b.value ? -1 : 1));

    const data = categories.map(({name, value}, index) => {
      let color = DEFAULT_PALETTE[index]; // TODO: >8 categories allowed?
      if (this.filterValues.length > 0) {
        color = this.filterValues.includes(name) ? color : '#cccccc';
      }
      return {value, name, itemStyle: {color}};
    });

    this.chart.setOption({
      xAxis: {data: data.map(({name}) => name)},
      yAxis: {type: 'value'},
      series: [{type: 'bar', name: this.header, data}],
      tooltip: {},
      grid: DEFAULT_CATEGORY_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'category-widget': CategoryWidget;
  }
}
