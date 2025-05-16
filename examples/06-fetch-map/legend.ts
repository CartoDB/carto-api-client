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
      if (!dataColumn) continue;

      const layerDiv = createLegendHeader(layer, scaleKey, dataColumn);

      const tilestats =
        layer.props.data?.tilestats?.layers[0]?.attributes?.find(
          (a: any) => a.attribute === dataColumn
        );

      // Numeric or categorical scale
      const isConstantColor = !scaleInfo.domain || !scaleInfo.range;
      if (isConstantColor) {
        const rangeDiv = div('legend-range');
        const colorSwatch = div('legend-color-swatch');
        const color = layer.props.getFillColor;
        colorSwatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

        const rangeLabel = div('legend-range-label', 'All values');

        rangeDiv.appendChild(colorSwatch);
        rangeDiv.appendChild(rangeLabel);
        layerDiv.appendChild(rangeDiv);
      } else if (
        scaleInfo &&
        scaleInfo.domain &&
        scaleInfo.range &&
        Array.isArray(scaleInfo.domain) &&
        Array.isArray(scaleInfo.range)
      ) {
        const {domain, range, type} = scaleInfo;
        if (type === 'custom' || type === 'quantile') {
          // Custom threshold scale: domain is [start1, start2, ..., null], range is colors
          for (let i = 0; i < range.length; i++) {
            const rangeDiv = div('legend-range');
            const colorSwatch = div('legend-color-swatch');
            colorSwatch.style.backgroundColor = range[i];

            let start: number;
            let end: number;
            if (type === 'custom') {
              start = domain[i - 1] || 0;
              end = domain[i] || Infinity;
            } else {
              start = domain[i];
              end = domain[i + 1];
            }
            const labelText = end === null || end === undefined || end === Infinity
              ? `>${start.toFixed(1)}`
              : `${start.toFixed(1)} – ${end.toFixed(1)}`;
            const rangeLabel = div('legend-range-label', labelText);

            rangeDiv.appendChild(colorSwatch);
            rangeDiv.appendChild(rangeLabel);
            layerDiv.appendChild(rangeDiv);
          }
        } else if (
          type === 'ordinal' ||
          type === 'point' ||
          typeof domain[0] === 'string'
        ) {
          for (let i = 0; i < domain.length; i++) {
            const rangeDiv = div('legend-range');
            const colorSwatch = div('legend-color-swatch');
            colorSwatch.style.backgroundColor = range[i];
            const rangeLabel = div('legend-range-label', domain[i]);

            rangeDiv.appendChild(colorSwatch);
            rangeDiv.appendChild(rangeLabel);
            layerDiv.appendChild(rangeDiv);
          }
        } else if (
          typeof domain[0] === 'number' &&
          typeof domain[1] === 'number' &&
          range.length > 1
        ) {
          const numRanges = range.length;
          const min = domain[0];
          const max = domain[1];
          console.log('legend domain', domain);
          const step = (max - min) / numRanges;
          for (let i = 0; i < numRanges; i++) {
            const rangeStart = min + step * i;
            const rangeEnd = i === numRanges - 1 ? max : min + step * (i + 1);

            const rangeDiv = div('legend-range');
            const colorSwatch = div('legend-color-swatch');
            colorSwatch.style.backgroundColor = range[i];
            const rangeLabel = div('legend-range-label', `${rangeStart.toFixed(1)} – ${rangeEnd.toFixed(1)}`);

            rangeDiv.appendChild(colorSwatch);
            rangeDiv.appendChild(rangeLabel);
            layerDiv.appendChild(rangeDiv);
          }
        }
      } else if (tilestats?.type === 'String' && tilestats.categories) {
        const categoriesDiv = div('legend-categories', `Categories: ${tilestats.categories.length}`);
        layerDiv.appendChild(categoriesDiv);
      }

      container.appendChild(layerDiv);
    }
  });

  wrapper.appendChild(container);
  return wrapper;
}

function createLegendHeader(layer: LayerDescriptor, scaleKey: string, dataColumn: string): HTMLElement {
  const layerDiv = div('legend-layer');
  layerDiv.appendChild(div('legend-title', layer.props.cartoLabel));
  layerDiv.appendChild(div('legend-header', `COLOR BASED ON`));
  layerDiv.appendChild(div('legend-column', dataColumn));
  return layerDiv;
}

function div(className: string, textContent?: string): HTMLElement {
  const div = document.createElement('div');
  div.className = className;
  if (textContent) { div.textContent = textContent; }
  return div;
}