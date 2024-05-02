import {LitElement, html, css} from 'lit';
import {Task} from '@lit/task';
import {customElement, property} from 'lit/decorators.js';
import {CartoDataView} from '../data-view';
import {DEBOUNCE_TIME_MS} from '../constants';
import {sleep} from '../utils';

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
      background: peachpuff;
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
        <div class="chart">&hellip;</div>
        <figcaption>${this.caption}</figcaption>
      </figure>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'category-widget': CategoryWidget;
  }
}
