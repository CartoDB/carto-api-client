import {LitElement, html, css, nothing} from 'lit';
import {Task} from '@lit/task';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {CartoDataView} from '../data-view';
import {DEBOUNCE_TIME_MS} from '../constants';
import {getWidgetFilters, sleep} from '../utils';
import * as echarts from 'echarts';
import {TaskStatus} from '@lit/task';

const DEFAULT_CATEGORY_GRID = {
  left: 0,
  right: '4px',
  top: '8px',
  bottom: '24px',
  width: 'auto',
  height: 'auto',
};

const DEFAULT_TEXT_STYLE = {fontFamily: 'Courier New, monospace'};

type Category = {name: string; value: number};

@customElement('category-widget')
export class CategoryWidget extends LitElement {
  static override styles = css`
    :host {
      --padding: 16px;

      position: relative;
      display: block;
      border: solid 1px gray;
      padding: var(--padding);
      max-width: 800px;
    }
    h3,
    p,
    figure {
      margin: 0;
      padding: 0;
    }
    figcaption {
      font-size: 0.8em;
      opacity: 0.8;
    }
    .chart {
      width: 100%;
      height: 200px;
    }
    .clear-btn {
      position: absolute;
      top: var(--padding);
      right: var(--padding);
    }
  `;

  @property()
  header = 'Untitled';

  @property()
  caption = 'Category widget';

  @property({type: CartoDataView}) // TODO: DataView
  dataView = null;

  @property({type: Object}) // TODO: types
  config = null;

  private readonly widgetId = crypto.randomUUID();
  private chart: echarts.ECharts | null = null;
  private chartRef: Ref<HTMLElement> = createRef();

  @state()
  private filterValues: string[] = [];

  private _categoryTask = new Task(this, {
    task: async ([dataView, config], {signal}) => {
      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      // TODO: If filtering logic mostly lives in the widget, not the DataView,
      // should we provide any utilities to make that easier for users who are
      // building custom widgets?

      // TODO: Cache requests, or at least avoid making requests when _this_
      // widget is filtered. Results will be the same.
      const filters = getWidgetFilters(this.widgetId, config.source.filters);
      const source = {...config.source, filters};
      return (await dataView.getCategories({...config, source})) as Category[]; // TODO: signal
    },
    args: () => [this.dataView, this.config],
  });

  override render() {
    return this._categoryTask.render({
      pending: () =>
        html`<h3>${this.header}</h3>
          <figure>
            <div class="chart" ${ref(this.chartRef)}></div>
            <figcaption>${this.caption}</figcaption>
          </figure>`,
      complete: () => html`
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
      `,
      error: (e) =>
        html`<h3>${this.header}</h3>
          <p>Error: ${e}</p>`,
    });
  }

  override updated() {
    if (!this.chart || this.chart.getDom() !== this.chartRef.value) {
      // TODO: improve caching of HTML elements.
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

  private async _updateChart() {
    if (this._categoryTask.status === TaskStatus.ERROR) {
      return;
    }

    const categories = await this._categoryTask.taskComplete;
    categories.sort((a, b) => (a.value > b.value ? -1 : 1));

    const accentColor = '#5470c6';
    const baseColor = this.filterValues.length > 0 ? '#cccccc' : accentColor;

    const labels = categories.map(({name}) => name) as string[];
    const data = categories.map(({name, value}) => {
      if (this.filterValues.includes(name)) {
        return {value, itemStyle: {color: accentColor}};
      }
      return {value, itemStyle: {color: baseColor}};
    });

    this.chart.setOption({
      xAxis: {data: labels},
      yAxis: {},
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
