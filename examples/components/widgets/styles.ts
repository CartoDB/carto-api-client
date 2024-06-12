import {css} from 'lit';

export const WIDGET_BASE_CSS = css`
  :host {
    --padding: 16px;

    position: relative;
    display: block;
    border: solid 1px gray;
    padding: var(--padding);
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
  .clear-btn {
    position: absolute;
    top: var(--padding);
    right: var(--padding);
  }
`;

export const DEFAULT_TEXT_STYLE = {fontFamily: 'Courier New, monospace'};
export const DEFAULT_PALETTE = [
  '#e41a1c',
  '#377eb8',
  '#4daf4a',
  '#984ea3',
  '#ff7f00',
  '#ffff33',
  '#a65628',
  '#f781bf',
];
