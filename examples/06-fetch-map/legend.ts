import {LayerDescriptor} from '@carto/api-client';

export function createLegend(layers: LayerDescriptor[]): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.width = '200px';
  container.style.background = 'white';
  container.style.padding = '10px';
  container.style.borderRadius = '4px';
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
    nameDiv.textContent = layer.props.cartoLabel;
    layerDiv.appendChild(nameDiv);

    const columnDiv = document.createElement('div');
    columnDiv.textContent = `Color based on: ${dataColumn}`;
    layerDiv.appendChild(columnDiv);

    // Add min/max values from tilestats
    const tilestats = layer.props.data?.tilestats?.layers[0]?.attributes?.find(
      (a: any) => a.attribute === dataColumn
    );
    if (tilestats) {
      const rangeDiv = document.createElement('div');
      if (tilestats.type === 'Number' && tilestats.min !== undefined) {
        rangeDiv.textContent = `Range: ${tilestats.min} - ${tilestats.max}`;
        layerDiv.appendChild(rangeDiv);

        // Create color bar
        const colorBar = document.createElement('div');
        colorBar.style.display = 'flex';
        colorBar.style.marginTop = '5px';
        colorBar.style.height = '20px';
        colorBar.style.width = '100%';
        colorBar.style.borderRadius = '4px';
        colorBar.style.overflow = 'hidden';

        // Create 5 color stops
        const numStops = 5;
        for (let i = 0; i < numStops; i++) {
          const value = tilestats.min + (tilestats.max - tilestats.min) * (i / (numStops - 1));
          const color = typeof layer.props.getFillColor !== 'function' ? layer.props.getFillColor : layer.props.getFillColor({properties: {[dataColumn]: value}});
          const stop = document.createElement('div');
          stop.style.flex = '1';
          stop.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          colorBar.appendChild(stop);
        }

        layerDiv.appendChild(colorBar);

        // Add labels
        const labels = document.createElement('div');
        labels.style.display = 'flex';
        labels.style.justifyContent = 'space-between';
        labels.style.fontSize = '10px';
        labels.style.marginTop = '2px';
        
        const minLabel = document.createElement('div');
        minLabel.textContent = tilestats.min.toFixed(0);
        labels.appendChild(minLabel);
        
        const maxLabel = document.createElement('div');
        maxLabel.textContent = tilestats.max.toFixed(0);
        labels.appendChild(maxLabel);
        
        layerDiv.appendChild(labels);
      } else if (tilestats.type === 'String' && tilestats.categories) {
        rangeDiv.textContent = `Categories: ${tilestats.categories.length}`;
        layerDiv.appendChild(rangeDiv);
      }
    }

    container.appendChild(layerDiv);
  });

  return container;
} 