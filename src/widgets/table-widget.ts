import {LitElement, css, html} from 'lit';
import {Task} from '@lit/task';
import {customElement, property} from 'lit/decorators.js';
import {DEBOUNCE_TIME_MS} from '../constants';
import {getSpatialFilter, sleep} from '../utils';
import {WidgetSource} from '../sources/index.js';
import {WIDGET_BASE_CSS} from './styles';
import {TableResponse} from '../types';
import {cache} from 'lit/directives/cache.js';
import {map} from 'lit/directives/map.js';
import {MapViewState} from '@deck.gl/core';

@customElement('table-widget')
export class TableWidget extends LitElement {
  static override styles = css`
    ${WIDGET_BASE_CSS}

    .table {
      width: 100%;
    }

    td,
    th {
      text-align: right;
    }

    td:first-child,
    th:first-child {
      text-align: left;
    }

    tbody tr:nth-child(2n + 1) {
      background: #f5f5f5;
    }
  `;

  @property({type: String})
  header = 'Untitled';

  @property({type: String})
  caption = 'Table widget';

  @property({type: Object, attribute: false})
  data: Promise<{widgetSource: WidgetSource}> | null = null;

  @property({type: Array})
  columns: string[] = [];

  @property({type: Object, attribute: false}) // TODO: types
  viewState: MapViewState | null = null;

  private _task = new Task(this, {
    task: async ([data, columns, viewState], {signal}) => {
      if (!data) {
        return {hasData: false, rows: [], totalCount: -1};
      }

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;
      const spatialFilter = viewState ? getSpatialFilter(viewState) : undefined;
      return widgetSource.getTable({columns, spatialFilter}); // TODO: signal
    },
    args: () => [this.data, this.columns, this.viewState] as const,
  });

  override render() {
    return this._task.render({
      pending: () =>
        html`<h3>${this.header}</h3>
          <figure>
            <div class="table">&hellip;</div>
            <figcaption>${this.caption}</figcaption>
          </figure>`,
      complete: (taskResult) => html`
        <h3>${this.header}</h3>
        <figure>
          <table class="table">
            ${cache(renderTableBody(taskResult))}
          </table>
          <figcaption>${this.caption}</figcaption>
        </figure>
      `,
      error: (e) =>
        html`<h3>${this.header}</h3>
          <p>Error: ${e}</p>`,
    });
  }
}

function renderTableBody(response: TableResponse) {
  if (!response.hasData) {
    return html`<tbody>
      <tr>
        <td>No rows</td>
      </tr>
    </tbody>`;
  }

  const headers = Object.keys(response.rows[0]);
  const rows = response.rows.map(Object.values);
  return html`
    <thead>
      <tr>
        ${map(headers, (header) => html`<th>${header}</th>`)}
      </tr>
    </thead>
    <tbody>
      ${map(rows, renderTableRow)}
    </tbody>
  `;
}

function renderTableRow(row: unknown[]) {
  return html`<tr>
    ${map(row, (value) => html`<td>${value}</td>`)}
  </tr>`;
}
