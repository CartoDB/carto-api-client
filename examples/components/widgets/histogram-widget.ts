import {html} from 'lit';
import {Task} from '@lit/task';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {cache} from 'lit/directives/cache.js';
import * as echarts from 'echarts';
import {TaskStatus} from '@lit/task';

import {DEBOUNCE_TIME_MS} from '../constants.js';
import {sleep} from '../utils.js';
import {DEFAULT_TEXT_STYLE} from './styles.js';
import {BaseWidget} from './base-widget.js';

const DEFAULT_HISTOGRAM_GRID = {
  left: 0,
  right: '4px',
  top: '8px',
  bottom: '24px',
  width: 'auto',
  height: 'auto',
};

export class HistogramWidget extends BaseWidget {
  static get properties() {
    return {
      ...super.properties,
      column: {type: String},
      operation: {type: String},
      ticks: {type: Array},
    };
  }

  declare column: string;
  declare operation: 'count' | 'avg' | 'min' | 'max' | 'sum';
  declare ticks: number[];

  protected _chart: echarts.ECharts | null = null;
  protected _chartRef: Ref<HTMLElement> = createRef();

  constructor() {
    super();
    this.column = '';
    this.operation = 'count';
    this.ticks = [];
  }

  protected _task = new Task(this, {
    task: async ([data, column, operation, ticks], {signal}) => {
      if (!data) return [];

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;

      return await widgetSource.getHistogram({
        filterOwner: this._widgetId,
        spatialFilter: this.getSpatialFilterOrViewState(),
        column,
        operation,
        ticks,
        viewState: this.viewState ?? undefined,
      });
    },
    args: () =>
      [
        this.data,
        this.column,
        this.operation,
        this.ticks,
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

    const values = await this._task.taskComplete;
    const data = values.map((value, binIndex) => ({
      name: getTickLabel(binIndex, this.ticks),
      value,
    }));

    this._chart!.setOption({
      xAxis: {data: data.map(({name}) => name)},
      yAxis: {type: 'value'},
      series: [{type: 'bar', name: this.header, data}],
      // Confine tooltip to the chart bounds, so it doesn't clip at sidebar scroll rect.
      tooltip: {confine: true},
      grid: DEFAULT_HISTOGRAM_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}

function getTickLabel(binIndex: number, ticks: number[]): string {
  // TODO: Confirm whether labels should be < or <=
  if (binIndex === 0) return `< ${ticks[binIndex]}`;
  if (binIndex === ticks.length) return `> ${ticks[ticks.length - 1]}`;
  return `${ticks[binIndex - 1]} to ${ticks[binIndex]}`;
}
