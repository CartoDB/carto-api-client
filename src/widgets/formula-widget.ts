import {LitElement, html, css} from 'lit';
import {Task} from '@lit/task';
import {customElement, property} from 'lit/decorators.js';
import {DEBOUNCE_TIME_MS} from '../constants';
import {getSpatialFilter, sleep} from '../utils';
import {AggregationTypes} from '../vendor/carto-constants';
import {WidgetSource} from '../sources/index.js';
import {MapViewState} from '@deck.gl/core';

@customElement('formula-widget')
export class FormulaWidget extends LitElement {
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
    .scorecard {
      font-size: 2.4em;
    }
  `;

  @property({type: String})
  header = 'Untitled';

  @property({type: String})
  caption = 'Formula widget';

  @property({type: Object, attribute: false})
  data: Promise<{widgetSource: WidgetSource}> | null = null;

  @property({type: AggregationTypes})
  operation = AggregationTypes.COUNT;

  @property({type: String})
  column = '';

  @property({type: Object, attribute: false})
  viewState: MapViewState | null = null;

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
