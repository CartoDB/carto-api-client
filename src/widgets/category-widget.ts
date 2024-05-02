import {LitElement, html, css} from 'lit';
import {Task} from '@lit/task';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {CartoDataView} from '../data-view';
import {DEBOUNCE_TIME_MS} from '../constants';
import {sleep} from '../utils';
import * as echarts from 'echarts';

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

  private chartRef: Ref<HTMLElement> = createRef();

  // @ts-ignore
  private _formulaTask = new Task(this, {
    // @ts-ignore
    task: async ([dataView, config], {signal}) => {
      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();
      // const response = await dataView.getFormula({...config}); // TODO: signal
      return '';
    },
    args: () => [this.dataView, this.config],
  });

  override render() {
    return html`
      <h3>${this.header}</h3>
      <figure>
        <div class="chart" ${ref(this.chartRef)}></div>
        <figcaption>${this.caption}</figcaption>
      </figure>
    `;
  }

  override firstUpdated() {
    const chart = echarts.init(this.chartRef.value!, null, {height: 200});
    chart.setOption({
      xAxis: {
        data: ['Shirts', 'Cardigans', 'Chiffons', 'Pants'],
      },
      yAxis: {},
      series: [
        {
          name: 'sales',
          type: 'bar',
          data: [5, 20, 36, 10],
        },
      ],
      tooltip: {},
      grid: {
        left: 0,
        right: '4px',
        top: '8px',
        bottom: '24px',
        width: 'auto',
        height: 'auto',
      },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'category-widget': CategoryWidget;
  }
}
