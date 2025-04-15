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
    columnDiv.textContent = `Data column: ${dataColumn}`;
    layerDiv.appendChild(columnDiv);

    // Add min/max values from tilestats
    const tilestats = layer.props.data?.tilestats?.layers[0]?.attributes?.find(
      (a: any) => a.attribute === dataColumn
    );
    if (tilestats) {
      const rangeDiv = document.createElement('div');
      rangeDiv.textContent = `Range: ${tilestats.min} - ${tilestats.max}`;
      layerDiv.appendChild(rangeDiv);
    }

    container.appendChild(layerDiv);
  });

  return container;
} 