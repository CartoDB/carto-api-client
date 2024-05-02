import {LitElement, html, css} from 'lit';
import {Task} from '@lit/task';
import {customElement, property} from 'lit/decorators.js';
import {CartoDataView} from '../data-view';

@customElement('data-formula')
export class DataFormula extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
    h3, p, figure {
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

  @property()
  header = 'Untitled';

  @property()
  caption = '';

  @property({type: CartoDataView}) // TODO: DataView
  dataView = null;

  @property({type: Object}) // TODO: types
  config = null;

  private _formulaTask = new Task(this, {
    task: async ([dataView, config], {signal}) => {
      const response = await dataView.getFormula({
        ...config,
        abortController: signal, // TODO
      });
      return response.value as number;
    },
    args: () => [this.dataView, this.config],
  });

  override render() {
    return this._formulaTask.render({
      pending: () =>
        html`<h3>${this.header}</h3>
          <p>Loading product...</p>`,
      complete: (formulaResult) => html`
        <h3>${this.header}</h3>
        <figure>
          <div class="scorecard">${formulaResult.toLocaleString()}</div>
          <figcaption>${this.caption}</figcaption>
        </figure>
      `,
      error: (e) =>
        html`<h3>${this.header}</h3>
          <p>Error: ${e}</p>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-formula': DataFormula;
  }
}
