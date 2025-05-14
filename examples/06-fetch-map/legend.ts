import {LayerDescriptor} from '@carto/api-client';
import './legend.css';

export function createLegend(layers: LayerDescriptor[]): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'legend-wrapper';

  const container = document.createElement('div');
  container.className = 'legend-container';

  layers.forEach((layer) => {
    const scaleInfo = layer.props.scales.lineColor || layer.props.scales.fillColor;
    const dataColumn = scaleInfo?.field?.name;
    if (!dataColumn) return;

    const layerDiv = document.createElement('div');
    layerDiv.className = 'legend-layer';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'legend-title';
    nameDiv.textContent = layer.props.cartoLabel;
    layerDiv.appendChild(nameDiv);

    const columnDiv = document.createElement('div');
    columnDiv.className = 'legend-header';
    columnDiv.textContent = `COLOR BASED ON`;
    layerDiv.appendChild(columnDiv);

    const dataColumnDiv = document.createElement('div');
    dataColumnDiv.className = 'legend-column';
    dataColumnDiv.textContent = dataColumn;
    layerDiv.appendChild(dataColumnDiv);

    const tilestats = layer.props.data?.tilestats?.layers[0]?.attributes?.find(
      (a: any) => a.attribute === dataColumn
    );

    const isConstantColor = !scaleInfo || !scaleInfo.domain || !scaleInfo.range;

    if (isConstantColor) {
      const rangeDiv = document.createElement('div');
      rangeDiv.className = 'legend-range';

      const colorSwatch = document.createElement('div');
      colorSwatch.className = 'legend-color-swatch';
      const color = layer.props.getFillColor;
      colorSwatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

      const rangeLabel = document.createElement('div');
      rangeLabel.className = 'legend-range-label';
      rangeLabel.textContent = 'All values';

      rangeDiv.appendChild(colorSwatch);
      rangeDiv.appendChild(rangeLabel);
      layerDiv.appendChild(rangeDiv);
      // debugger;
    } else if (scaleInfo && scaleInfo.domain && scaleInfo.range && Array.isArray(scaleInfo.domain) && Array.isArray(scaleInfo.range)) {
      // Numeric or categorical scale
      const {domain, range, field, type} = scaleInfo;
      // For quantize/quantile/linear, domain is [min, max], range is array of colors
      if (typeof domain[0] === 'number' && typeof domain[1] === 'number' && range.length > 1) {
        const numRanges = range.length;
        const min = domain[0];
        const max = domain[1];
        const step = (max - min) / numRanges;
        for (let i = 0; i < numRanges; i++) {
          const rangeStart = min + step * i;
          const rangeEnd = i === numRanges - 1 ? max : min + step * (i + 1);

          const rangeDiv = document.createElement('div');
          rangeDiv.className = 'legend-range';

          const colorSwatch = document.createElement('div');
          colorSwatch.className = 'legend-color-swatch';
          colorSwatch.style.backgroundColor = range[i];

          const rangeLabel = document.createElement('div');
          rangeLabel.className = 'legend-range-label';
          rangeLabel.textContent = `${rangeStart.toFixed(2)} – ${rangeEnd.toFixed(2)}`;

          rangeDiv.appendChild(colorSwatch);
          rangeDiv.appendChild(rangeLabel);
          layerDiv.appendChild(rangeDiv);
        }
      } else if (type === 'ordinal' || type === 'point' || (typeof domain[0] === 'string')) {
        // Categorical
        for (let i = 0; i < domain.length; i++) {
          const rangeDiv = document.createElement('div');
          rangeDiv.className = 'legend-range';

          const colorSwatch = document.createElement('div');
          colorSwatch.className = 'legend-color-swatch';
          colorSwatch.style.backgroundColor = range[i];

          const rangeLabel = document.createElement('div');
          rangeLabel.className = 'legend-range-label';
          rangeLabel.textContent = domain[i];

          rangeDiv.appendChild(colorSwatch);
          rangeDiv.appendChild(rangeLabel);
          layerDiv.appendChild(rangeDiv);
        }
      }
    } else if (tilestats?.type === 'String' && tilestats.categories) {
      const categoriesDiv = document.createElement('div');
      categoriesDiv.className = 'legend-categories';
      categoriesDiv.textContent = `Categories: ${tilestats.categories.length}`;
      layerDiv.appendChild(categoriesDiv);
    }

    container.appendChild(layerDiv);
  });

  wrapper.appendChild(container);
  return wrapper;
}
