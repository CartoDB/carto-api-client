import {html, css} from 'lit';
import {Task} from '@lit/task';
import {AggregationTypes} from '@carto/api-client';
import {DEBOUNCE_TIME_MS} from '../constants.js';
import {getSpatialFilter, sleep} from '../utils.js';
import {BaseWidget} from './base-widget.js';
import {WIDGET_BASE_CSS} from './styles.js';

export class FormulaWidget extends BaseWidget {
  static override styles = css`
    ${WIDGET_BASE_CSS}

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
    .scorecard {
      font-size: 2.4em;
    }
  `;

  static get properties() {
    return {
      ...super.properties,
      operation: {type: AggregationTypes},
      column: {type: String},
    };
  }

  declare operation: AggregationTypes;
  declare column: string;

  constructor() {
    super();
    this.operation = AggregationTypes.COUNT;
    this.column = '';
  }

  private _task = new Task(this, {
    task: async ([data, operation, column, viewState], {signal}) => {
      if (!data) return -1;

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;
      const spatialFilter = viewState ? getSpatialFilter(viewState) : undefined;
      const response = await widgetSource.getFormula({
        operation,
        column,
        spatialFilter,
      }); // TODO: signal
      return response.value;
    },
    args: () =>
      [this.data, this.operation, this.column, this.viewState] as const,
  });

  override render() {
    return this._task.render({
      pending: () =>
        html`<h3>${this.header}</h3>
          <figure>
            <div class="scorecard">&hellip;</div>
            <figcaption>${this.caption}</figcaption>
          </figure>`,
      complete: (taskResult) => html`
        <h3>${this.header}</h3>
        <figure>
          <div class="scorecard">${taskResult.toLocaleString()}</div>
          <figcaption>${this.caption}</figcaption>
        </figure>
      `,
      error: (e) =>
        html`<h3>${this.header}</h3>
          <p>Error: ${e}</p>`,
    });
  }
}
