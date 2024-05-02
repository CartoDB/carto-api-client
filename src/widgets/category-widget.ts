import {LitElement, html, css} from 'lit';
import {Task} from '@lit/task';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {CartoDataView} from '../data-view';
import {DEBOUNCE_TIME_MS} from '../constants';
import {sleep} from '../utils';
import * as echarts from 'echarts';
import { TaskStatus } from '@lit/task';

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
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
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
  `;

  @property()
  header = 'Untitled';

  @property()
  caption = 'Category widget';

  @property({type: CartoDataView}) // TODO: DataView
  dataView = null;

  @property({type: Object}) // TODO: types
  config = null;

  private chart: echarts.ECharts | null = null;
  private chartRef: Ref<HTMLElement> = createRef();

  private _categoryTask = new Task(this, {
    task: async ([dataView, config], {signal}) => {
      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();
      const response = await dataView.getCategories({...config}); // TODO: signal
      return {
        labels: response.map(({name}) => name) as string[],
        data: response.map(({value}) => value) as number[],
      };
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
    }
    this._updateChart()
  }

  private async _updateChart() {
    if (this._categoryTask.status === TaskStatus.ERROR) {
      return;
    }

    // TODO: real error handling
    const {labels, data} = await this._categoryTask.taskComplete;
    this.chart.setOption({
      xAxis: {data: labels},
      yAxis: {},
      series: [
        {type: 'bar', name: this.header, data},
      ],
      tooltip: {},
      grid: DEFAULT_CATEGORY_GRID,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'category-widget': CategoryWidget;
  }
}
