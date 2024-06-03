import {LitElement, html} from 'lit';
import {Task} from '@lit/task';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {DEBOUNCE_TIME_MS} from '../constants';
import {getSpatialFilter, sleep} from '../utils';
import * as echarts from 'echarts';
import {TaskStatus} from '@lit/task';
import {DEFAULT_TEXT_STYLE, WIDGET_BASE_CSS} from './styles';
import {cache} from 'lit/directives/cache.js';
import {AggregationTypes} from '../vendor/carto-constants';
import {WidgetSource} from '../sources/index.js';

const DEFAULT_SCATTER_GRID = {
  left: '90px',
  right: '50px',
  top: '24px',
  bottom: '40px',
  width: 'auto',
  height: 'auto',
};

@customElement('scatter-widget')
export class ScatterWidget extends LitElement {
  static override styles = WIDGET_BASE_CSS;

  @property()
  header = 'Untitled';

  @property()
  caption = 'Scatter widget';

  @property({type: Object, attribute: false}) // TODO: types
  data = null;

  @property({type: String})
  xAxisColumn: string;

  @property({type: AggregationTypes})
  xAxisJoinOperation = AggregationTypes.COUNT;

  @property({type: String})
  yAxisColumn: string;

  @property({type: AggregationTypes})
  yAxisJoinOperation = AggregationTypes.COUNT;

  @property({type: Object, attribute: false}) // TODO: types
  viewState = null;

  protected readonly widgetId = crypto.randomUUID();
  protected chart: echarts.ECharts | null = null;
  protected chartRef: Ref<HTMLElement> = createRef();

  @state()
  protected filterValues: string[] = [];

  protected _task = new Task(this, {
    task: async (
      [
        data,
        viewState,
        xAxisColumn,
        xAxisJoinOperation,
        yAxisColumn,
        yAxisJoinOperation,
      ],
      {signal}
    ) => {
      if (!data) return [];

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = (await data) as {widgetSource: WidgetSource};
      const spatialFilter = viewState ? getSpatialFilter(viewState) : undefined;

      return await widgetSource.getScatter({
        filterOwner: this.widgetId,
        spatialFilter,
        xAxisColumn,
        xAxisJoinOperation,
        yAxisColumn,
        yAxisJoinOperation,
      }); // TODO: signal
    },
    args: () => [
      this.data,
      this.viewState,
      this.xAxisColumn,
      this.xAxisJoinOperation,
      this.yAxisColumn,
      this.yAxisJoinOperation,
    ],
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
    }

    this._updateChart();
  }

  protected async _updateChart() {
    if (this._task.status === TaskStatus.ERROR) {
      return;
    }

    const data = await this._task.taskComplete;

    this.chart.setOption({
      xAxis: {name: this.xAxisColumn, nameLocation: 'middle', nameGap: 20},
      yAxis: {name: this.yAxisColumn, nameLocation: 'middle', nameGap: 80},
      series: [{type: 'scatter', symbolSize: 8, data}],
      tooltip: {},
      grid: DEFAULT_SCATTER_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scatter-widget': ScatterWidget;
  }
}
