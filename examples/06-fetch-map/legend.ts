import {LayerDescriptor} from '@carto/api-client';
import './legend.css';

export function createLegend(layers: LayerDescriptor[]): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'legend-wrapper';

  const container = document.createElement('div');
  container.className = 'legend-container';

  layers.forEach((layer, index) => {
    const widgetSource = layer.props.data?.widgetSource?.props;
    if (!widgetSource) return;
    
    const {columns, spatialDataColumn} = widgetSource;
    const dataColumn = columns?.find((col: string) => col !== spatialDataColumn);
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
    
    const isConstantColor = typeof layer.props.getFillColor !== 'function';
    
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
    } else if (tilestats && tilestats.type === 'Number' && tilestats.min !== undefined) {
      const numRanges = 6;
      const min = tilestats.min;
      const max = tilestats.max;
      const step = (max - min) / numRanges;

      for (let i = 0; i < numRanges; i++) {
        const rangeStart = min + (step * i);
        const rangeEnd = i === numRanges - 1 ? max : min + (step * (i + 1));
        
        const rangeDiv = document.createElement('div');
        rangeDiv.className = 'legend-range';
        
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'legend-color-swatch';
        
        const value = (rangeStart + rangeEnd) / 2;
        const color = layer.props.getFillColor({properties: {[dataColumn]: value}});
        colorSwatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        
        const rangeLabel = document.createElement('div');
        rangeLabel.className = 'legend-range-label';
        rangeLabel.textContent = `${rangeStart.toFixed(2)} – ${rangeEnd.toFixed(2)}`;
        
        rangeDiv.appendChild(colorSwatch);
        rangeDiv.appendChild(rangeLabel);
        layerDiv.appendChild(rangeDiv);
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