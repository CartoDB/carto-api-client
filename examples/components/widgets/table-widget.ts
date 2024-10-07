import {css, html} from 'lit';
import {Task} from '@lit/task';
import {DEBOUNCE_TIME_MS} from '../constants.js';
import {sleep} from '../utils.js';
import {SortDirection, TableResponse} from '@carto/api-client';
import {cache} from 'lit/directives/cache.js';
import {map} from 'lit/directives/map.js';
import {BaseWidget} from './base-widget.js';

export class TableWidget extends BaseWidget {
  static override styles = [
    BaseWidget.styles,
    css`
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
    `,
  ];

  static get properties() {
    return {
      ...super.properties,
      columns: {type: Array},
      sortBy: {type: String},
      sortDirection: {type: String},
      limit: {type: Number},
    };
  }

  declare columns: string[];
  declare sortBy: string | undefined;
  declare sortDirection: SortDirection;
  declare limit: number;

  constructor() {
    super();
    this.columns = [];
    this.sortBy = undefined;
    this.sortDirection = 'desc';
    this.limit = 10;
  }

  private _task = new Task(this, {
    task: async ([data, columns, sortBy, sortDirection, limit], {signal}) => {
      if (!data) {
        return {hasData: false, rows: [], totalCount: -1};
      }

      await sleep(DEBOUNCE_TIME_MS);
      signal.throwIfAborted();

      const {widgetSource} = await data;
      return widgetSource.getTable({
        columns,
        ...(sortBy && {sortBy, sortDirection}),
        limit,
        spatialFilter: this.getSpatialFilterOrViewState(),
      });
    },
    args: () =>
      [
        this.data,
        this.columns,
        this.sortBy,
        this.sortDirection,
        this.limit,
        this.viewState,
        this.spatialFilter,
      ] as const,
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
  if (!response.totalCount) {
    return html`<tbody>
      <tr>
        <td>No results</td>
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
    ${map(row, renderTableCell)}
  </tr>`;
}

const _numberFormatter = new Intl.NumberFormat();
function renderTableCell(value: unknown) {
  let formattedValue: string;
  if (typeof value === 'number') {
    return _numberFormatter.format(value);
  } else {
    formattedValue = String(value);
  }
  return html`<td>${formattedValue}</td>`;
}
