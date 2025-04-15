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
  container.style.fontFamily = 'Inter, sans-serif';

  layers.forEach((layer, index) => {
    const widgetSource = layer.props.data?.widgetSource?.props;
    if (!widgetSource) return;
    
    const {columns, spatialDataColumn} = widgetSource;
    const dataColumn = columns?.find((col: string) => col !== spatialDataColumn);
    if (!dataColumn) return;

    const layerDiv = document.createElement('div');
    layerDiv.style.marginBottom = '10px';

    const nameDiv = document.createElement('div');
    nameDiv.style.margin = '0px';
    nameDiv.style.fontFamily = 'Inter, sans-serif';
    nameDiv.style.fontWeight = '400';
    nameDiv.style.fontSize = '0.8125rem';
    nameDiv.style.lineHeight = '1.538';
    nameDiv.style.letterSpacing = '0px';
    nameDiv.style.color = 'rgb(44, 48, 50)';
    nameDiv.style.marginBottom = '12px';
    nameDiv.textContent = layer.props.cartoLabel;
    layerDiv.appendChild(nameDiv);

    const columnDiv = document.createElement('div');
    columnDiv.style.color = '#6c757d';
    columnDiv.style.fontSize = '10px';
    columnDiv.style.marginBottom = '4px';
    columnDiv.textContent = `COLOR BASED ON`;
    layerDiv.appendChild(columnDiv);

    const dataColumnDiv = document.createElement('div');
    dataColumnDiv.style.margin = '0px';
    dataColumnDiv.style.fontFamily = 'Inter, sans-serif';
    dataColumnDiv.style.fontWeight = '400';
    dataColumnDiv.style.fontSize = '0.75rem';
    dataColumnDiv.style.lineHeight = '1.538';
    dataColumnDiv.style.letterSpacing = '0px';
    dataColumnDiv.style.color = 'rgb(44, 48, 50)';
    dataColumnDiv.style.marginBottom = '12px';
    dataColumnDiv.textContent = dataColumn;
    layerDiv.appendChild(dataColumnDiv);

    const tilestats = layer.props.data?.tilestats?.layers[0]?.attributes?.find(
      (a: any) => a.attribute === dataColumn
    );
    
    const isConstantColor = typeof layer.props.getFillColor !== 'function';
    
    if (isConstantColor) {
      const rangeDiv = document.createElement('div');
      rangeDiv.style.display = 'flex';
      rangeDiv.style.alignItems = 'center';
      rangeDiv.style.marginBottom = '6px';
      
      const colorSwatch = document.createElement('div');
      colorSwatch.style.width = '12px';
      colorSwatch.style.height = '12px';
      colorSwatch.style.borderRadius = '50%';
      colorSwatch.style.marginRight = '6px';
      colorSwatch.style.flexShrink = '0';
      
      const color = layer.props.getFillColor;
      colorSwatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      
      const rangeLabel = document.createElement('div');
      rangeLabel.style.margin = '0px';
      rangeLabel.style.fontFamily = 'Inter, sans-serif';
      rangeLabel.style.fontWeight = '400';
      rangeLabel.style.fontSize = '0.75rem';
      rangeLabel.style.lineHeight = '1.538';
      rangeLabel.style.letterSpacing = '0px';
      rangeLabel.style.color = 'rgb(44, 48, 50)';
      rangeLabel.style.whiteSpace = 'nowrap';
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
        rangeDiv.style.display = 'flex';
        rangeDiv.style.alignItems = 'center';
        rangeDiv.style.marginBottom = '6px';
        
        const colorSwatch = document.createElement('div');
        colorSwatch.style.width = '12px';
        colorSwatch.style.height = '12px';
        colorSwatch.style.borderRadius = '50%';
        colorSwatch.style.marginRight = '6px';
        colorSwatch.style.flexShrink = '0';
        
        const value = (rangeStart + rangeEnd) / 2;
        const color = layer.props.getFillColor({properties: {[dataColumn]: value}});
        colorSwatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        
        const rangeLabel = document.createElement('div');
        rangeLabel.style.margin = '0px';
        rangeLabel.style.fontFamily = 'Inter, sans-serif';
        rangeLabel.style.fontWeight = '400';
        rangeLabel.style.fontSize = '0.75rem';
        rangeLabel.style.lineHeight = '1.538';
        rangeLabel.style.letterSpacing = '0px';
        rangeLabel.style.color = 'rgb(44, 48, 50)';
        rangeLabel.style.whiteSpace = 'nowrap';
        rangeLabel.textContent = `${rangeStart.toFixed(2)} – ${rangeEnd.toFixed(2)}`;
        
        rangeDiv.appendChild(colorSwatch);
        rangeDiv.appendChild(rangeLabel);
        layerDiv.appendChild(rangeDiv);
      }
    } else if (tilestats?.type === 'String' && tilestats.categories) {
      const categoriesDiv = document.createElement('div');
      categoriesDiv.style.fontSize = '0.75rem';
      categoriesDiv.textContent = `Categories: ${tilestats.categories.length}`;
      layerDiv.appendChild(categoriesDiv);
    }

    container.appendChild(layerDiv);
  });

  return container;
} 