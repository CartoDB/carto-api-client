import {LayerDescriptor} from '@carto/api-client';

export function createLegend(layers: LayerDescriptor[]): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.width = '200px';
  container.style.maxHeight = '400px';
  container.style.overflowY = 'auto';
  container.style.background = 'white';
  container.style.padding = '16px';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  container.style.zIndex = '1000';

  layers.forEach((layer, index) => {
    const widgetSource = layer.props.data?.widgetSource?.props;
    if (!widgetSource) return;
    
    const {columns, spatialDataColumn} = widgetSource;
    const dataColumn = columns?.find((col: string) => col !== spatialDataColumn);
    if (!dataColumn) return;

    const layerDiv = document.createElement('div');
    layerDiv.style.marginBottom = '10px';

    const nameDiv = document.createElement('div');
    nameDiv.style.fontWeight = 'bold';
    nameDiv.style.marginBottom = '12px';
    nameDiv.textContent = layer.props.cartoLabel;
    layerDiv.appendChild(nameDiv);

    const columnDiv = document.createElement('div');
    columnDiv.style.color = '#6c757d';
    columnDiv.style.fontSize = '12px';
    columnDiv.style.marginBottom = '8px';
    columnDiv.textContent = `COLOR BASED ON`;
    layerDiv.appendChild(columnDiv);

    const dataColumnDiv = document.createElement('div');
    dataColumnDiv.style.marginBottom = '16px';
    dataColumnDiv.textContent = dataColumn;
    layerDiv.appendChild(dataColumnDiv);

    // Add color ranges
    const tilestats = layer.props.data?.tilestats?.layers[0]?.attributes?.find(
      (a: any) => a.attribute === dataColumn
    );
    if (tilestats && tilestats.type === 'Number' && tilestats.min !== undefined) {
      // Create 6 ranges like in the screenshot
      const numRanges = 6;
      const min = tilestats.min;
      const max = tilestats.max;
      const step = (max - min) / numRanges;

      for (let i = 0; i < numRanges; i++) {
        const rangeStart = min + (step * i);
        const rangeEnd = i === numRanges - 1 ? max : min + (step * (i + 1));
        
        const rangeDiv = document.createElement('div');
        rangeDiv.style.display = 'flex';
        rangeDiv.style.alignItems = 'center';
        rangeDiv.style.marginBottom = '8px';
        
        const colorSwatch = document.createElement('div');
        colorSwatch.style.width = '20px';
        colorSwatch.style.height = '20px';
        colorSwatch.style.borderRadius = '50%';
        colorSwatch.style.marginRight = '8px';
        colorSwatch.style.flexShrink = '0';
        
        const value = (rangeStart + rangeEnd) / 2;
        const color = typeof layer.props.getFillColor !== 'function' ? 
          layer.props.getFillColor : 
          layer.props.getFillColor({properties: {[dataColumn]: value}});
        colorSwatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        
        const rangeLabel = document.createElement('div');
        rangeLabel.style.fontSize = '12px';
        rangeLabel.style.whiteSpace = 'nowrap';
        rangeLabel.textContent = `${rangeStart.toFixed(2)} – ${rangeEnd.toFixed(2)}`;
        
        rangeDiv.appendChild(colorSwatch);
        rangeDiv.appendChild(rangeLabel);
        layerDiv.appendChild(rangeDiv);
      }
    } else if (tilestats?.type === 'String' && tilestats.categories) {
      const categoriesDiv = document.createElement('div');
      categoriesDiv.textContent = `Categories: ${tilestats.categories.length}`;
      layerDiv.appendChild(categoriesDiv);
    }

    container.appendChild(layerDiv);
  });

  return container;
} 