import {html, css} from 'lit';
import {Task} from '@lit/task';
import {AggregationType} from '@carto/api-client';
import {DEBOUNCE_TIME_MS} from '../constants.js';
import {sleep} from '../utils.js';
import {BaseWidget} from './base-widget.js';

export class FormulaWidget extends BaseWidget {
  static override styles = [
    BaseWidget.styles,
    css`
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
    `,
  ];

  static get properties() {
    return {
      ...super.properties,
      operation: {type: String},
      column: {type: String},
    };
  }

  declare operation: AggregationType;
  declare column: string;

  constructor() {
    super();
    this.operation = 'count';
    this.column = '';
  }

  private _task = new Task(this, {
    task: async ([data, operation, column], {signal}) => {
      if (!data) return -1;

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;
      const response = await widgetSource.getFormula({
        operation,
        column,
        spatialFilter: this.getSpatialFilterOrViewState(),
      });
      return response.value;
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
