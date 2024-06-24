import {html} from 'lit';
import {Task} from '@lit/task';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {cache} from 'lit/directives/cache.js';
import * as echarts from 'echarts';
import {TaskStatus} from '@lit/task';
import {AggregationType} from '@carto/api-client';

import {DEBOUNCE_TIME_MS} from '../constants.js';
import {sleep} from '../utils.js';
import {DEFAULT_TEXT_STYLE} from './styles.js';
import {BaseWidget} from './base-widget.js';

const DEFAULT_SCATTER_GRID = {
  left: '90px',
  right: '50px',
  top: '24px',
  bottom: '40px',
  width: 'auto',
  height: 'auto',
};

export class ScatterWidget extends BaseWidget {
  static get properties() {
    return {
      ...super.properties,
      xAxisColumn: {type: String},
      yAxisColumn: {type: String},
      xAxisJoinOperation: {type: String},
      yAxisJoinOperation: {type: String},
    };
  }

  declare xAxisColumn: string;
  declare xAxisJoinOperation: AggregationType;
  declare yAxisColumn: string;
  declare yAxisJoinOperation: AggregationType;

  protected _chart: echarts.ECharts | null = null;
  protected _chartRef: Ref<HTMLElement> = createRef();

  constructor() {
    super();
    this.xAxisColumn = '';
    this.xAxisJoinOperation = 'count';
    this.yAxisColumn = '';
    this.yAxisJoinOperation = 'count';
  }

  protected _task = new Task(this, {
    task: async (
      [data, xAxisColumn, xAxisJoinOperation, yAxisColumn, yAxisJoinOperation],
      {signal}
    ) => {
      if (!data) return [];

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;

      return await widgetSource.getScatter({
        filterOwner: this._widgetId,
        spatialFilter: this.getSpatialFilterOrViewState(),
        xAxisColumn,
        xAxisJoinOperation,
        yAxisColumn,
        yAxisJoinOperation,
      });
    },
    args: () =>
      [
        this.data,
        this.xAxisColumn,
        this.xAxisJoinOperation,
        this.yAxisColumn,
        this.yAxisJoinOperation,
        this.viewState,
        this.spatialFilter,
      ] as const,
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
            <div class="chart" ${ref(this._chartRef)}></div>
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

    if (!this._chart || this._chart.getDom() !== this._chartRef.value) {
      this._chart = echarts.init(this._chartRef.value!, null, {height: 200});
    }

    this._updateChart();
  }

  protected async _updateChart() {
    if (this._task.status === TaskStatus.ERROR) {
      return;
    }

    const data = await this._task.taskComplete;

    this._chart!.setOption({
      xAxis: {name: this.xAxisColumn, nameLocation: 'middle', nameGap: 20},
      yAxis: {name: this.yAxisColumn, nameLocation: 'middle', nameGap: 80},
      series: [{type: 'scatter', symbolSize: 8, data}],
      tooltip: {},
      grid: DEFAULT_SCATTER_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}
