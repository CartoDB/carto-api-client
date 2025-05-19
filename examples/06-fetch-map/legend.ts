import './legend.css';
import {LayerDescriptor, ScaleKey} from '@carto/api-client';

export function createLegend(layers: LayerDescriptor[]): HTMLElement {
  const wrapper = div('legend-wrapper');
  const container = div('legend-container');

  layers.forEach((layer) => {
    const scales = layer.scales || {};
    for (const scaleKey of Object.keys(scales) as ScaleKey[]) {
      const scaleInfo = scales[scaleKey];
      const dataColumn = scaleInfo?.field?.name;
      const layerDiv = createLegendHeader(layer, scaleKey, dataColumn);
      const isStroke = scaleKey === 'lineColor';

      if (!dataColumn) {
        const color = layer.props.getFillColor;
        const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        layerDiv.appendChild(
          createColorSwatch(rgb, layer.props.cartoLabel, isStroke)
        );
      } else if (scaleKey === 'pointRadius') {
        const {domain, range} = scaleInfo;
        const numericDomain = domain.map(Number);
        const numericRange = range.map(Number);
        layerDiv.appendChild(createRadiusScale(numericDomain, numericRange));
      } else {
        const {domain, range, type} = scaleInfo;
        if (type === 'ordinal' || type === 'point') {
          // Simple one to one mapping
          for (let i = 0; i < domain.length; i++) {
            layerDiv.appendChild(
              createColorSwatch(
                range[i] as string,
                domain[i] as string,
                isStroke
              )
            );
          }
        } else if (type === 'custom' || type === 'quantile') {
          // Custom threshold scale: domain is [start1, start2, ..., null], range is colors
          for (let i = 0; i < range.length; i++) {
            let start: number;
            let end: number;
            if (type === 'custom') {
              start = (domain[i - 1] as number) || 0;
              end = (domain[i] as number) || Infinity;
            } else {
              start = domain[i] as number;
              end = domain[i + 1] as number;
            }
            const labelText =
              end === null || end === undefined || end === Infinity
                ? `>${start.toFixed(1)}`
                : `${start.toFixed(1)} – ${end.toFixed(1)}`;
            layerDiv.appendChild(
              createColorSwatch(range[i] as string, labelText, isStroke)
            );
          }
        } else if (
          type === 'linear' ||
          type === 'quantize' ||
          type === 'sqrt'
        ) {
          // Interpolate domain values to get a color for each range
          const numRanges = range.length;
          const min = domain[0] as number;
          const max = domain[1] as number;
          const step = (max - min) / numRanges;
          for (let i = 0; i < numRanges; i++) {
            const rangeStart = min + step * i;
            const rangeEnd = i === numRanges - 1 ? max : min + step * (i + 1);
            const labelText = `${rangeStart.toFixed(1)} – ${rangeEnd.toFixed(1)}`;
            layerDiv.appendChild(
              createColorSwatch(range[i] as string, labelText, isStroke)
            );
          }
        } else {
          throw new Error(`Unsupported scale type: ${type}`);
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

const HEADER_MAP: Record<ScaleKey, string> = {
  fillColor: 'COLOR BASED ON',
  pointRadius: 'RADIUS RANGE BY',
  lineColor: 'STROKE COLOR BASED ON',
  elevation: 'ELEVATION BASED ON',
  weight: 'WEIGHT BASED ON',
};

function createLegendHeader(
  layer: LayerDescriptor,
  scaleKey: ScaleKey,
  dataColumn?: string
): HTMLElement {
  const layerDiv = div('legend-layer');
  layerDiv.appendChild(div('legend-title', layer.props.cartoLabel));
  if (dataColumn) {
    layerDiv.appendChild(div('legend-header', HEADER_MAP[scaleKey]));
    layerDiv.appendChild(div('legend-column', dataColumn));
  }
  return layerDiv;
}

function createColorSwatch(
  color: string,
  label: string,
  stroke?: boolean
): HTMLElement {
  const rangeDiv = div('legend-range');
  const colorSwatch = div('legend-color-swatch');
  if (stroke) {
    colorSwatch.style.borderColor = color;
    colorSwatch.style.backgroundColor = 'transparent';
  } else {
    colorSwatch.style.backgroundColor = color;
    colorSwatch.style.border = 'none';
  }
  const rangeLabel = div('legend-range-label', label);
  rangeDiv.appendChild(colorSwatch);
  rangeDiv.appendChild(rangeLabel);
  return rangeDiv;
}

function createRadiusScale(domain: number[], range: number[]): HTMLElement {
  const container = div('legend-radius-scale');

  // Create a circle for each value in the range
  range.forEach((radius, i) => {
    const row = div('legend-radius-row');

    const circle = div('legend-radius-circle');
    circle.style.width = `${radius * 2}px`;
    circle.style.height = `${radius * 2}px`;

    const label = div('legend-radius-label', domain[i].toFixed(1));

    if (radius > 8) {
      // For larger circles, position label inside
      circle.style.position = 'relative';
      label.style.position = 'absolute';
      label.style.top = '50%';
      label.style.left = '50%';
      label.style.transform = 'translate(-50%, -50%)';
      circle.appendChild(label);
      row.appendChild(circle);
    } else {
      // For smaller circles, keep label below
      row.appendChild(circle);
      row.appendChild(label);
    }

    container.appendChild(row);
  });

  return container;
}
