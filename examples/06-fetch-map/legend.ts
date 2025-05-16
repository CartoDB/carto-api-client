import './legend.css';
import {LayerDescriptor} from '@carto/api-client';

export function createLegend(layers: LayerDescriptor[]): HTMLElement {
  const wrapper = div('legend-wrapper');
  const container = div('legend-container');

  layers.forEach((layer) => {
    const scales = layer.scales || {};
    for (const scaleKey of Object.keys(scales)) {
      const scaleInfo = scales[scaleKey];
      const dataColumn = scaleInfo?.field?.name;
      const layerDiv = createLegendHeader(layer, dataColumn);

      if (!dataColumn) {
        const color = layer.props.getFillColor;
        const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        layerDiv.appendChild(createColorSwatch(rgb, layer.props.cartoLabel));
      } else {
        const {domain, range, type} = scaleInfo;
        if (
          type === 'ordinal' ||
          type === 'point' ||
          typeof domain[0] === 'string'
        ) {
          // Simple one to one mapping
          for (let i = 0; i < domain.length; i++) {
            layerDiv.appendChild(createColorSwatch(range[i], domain[i]));
          }
        } else if (type === 'custom' || type === 'quantile') {
          // Custom threshold scale: domain is [start1, start2, ..., null], range is colors
          for (let i = 0; i < range.length; i++) {
            let start: number;
            let end: number;
            if (type === 'custom') {
              start = domain[i - 1] || 0;
              end = domain[i] || Infinity;
            } else {
              start = domain[i];
              end = domain[i + 1];
            }
            const labelText =
              end === null || end === undefined || end === Infinity
                ? `>${start.toFixed(1)}`
                : `${start.toFixed(1)} – ${end.toFixed(1)}`;
            layerDiv.appendChild(createColorSwatch(range[i], labelText));
          }
        } else if (
          typeof domain[0] === 'number' &&
          typeof domain[1] === 'number' &&
          range.length > 1
        ) {
          // Interpolate domain values to get a color for each range
          const numRanges = range.length;
          const min = domain[0];
          const max = domain[1];
          const step = (max - min) / numRanges;
          for (let i = 0; i < numRanges; i++) {
            const rangeStart = min + step * i;
            const rangeEnd = i === numRanges - 1 ? max : min + step * (i + 1);
            const labelText = `${rangeStart.toFixed(1)} – ${rangeEnd.toFixed(1)}`;
            layerDiv.appendChild(createColorSwatch(range[i], labelText));
          }
        }
      }

      container.appendChild(layerDiv);
    }
  });

  wrapper.appendChild(container);
  return wrapper;
}

// UI helpers. In a real app, you'd probably use a library like React or Vue.
function div(className: string, textContent?: string): HTMLElement {
  const div = document.createElement('div');
  div.className = className;
  if (textContent) {
    div.textContent = textContent;
  }
  return div;
}

function createLegendHeader(
  layer: LayerDescriptor,
  dataColumn?: string
): HTMLElement {
  const layerDiv = div('legend-layer');
  layerDiv.appendChild(div('legend-title', layer.props.cartoLabel));
  if (dataColumn) {
    layerDiv.appendChild(div('legend-header', `COLOR BASED ON`));
    layerDiv.appendChild(div('legend-column', dataColumn));
  }
  return layerDiv;
}

function createColorSwatch(color: string, label: string): HTMLElement {
  const rangeDiv = div('legend-range');
  const colorSwatch = div('legend-color-swatch');
  colorSwatch.style.backgroundColor = color;
  const rangeLabel = div('legend-range-label', label);
  rangeDiv.appendChild(colorSwatch);
  rangeDiv.appendChild(rangeLabel);
  return rangeDiv;
}
