import {TaskStatus} from '@lit/task';

import {DEFAULT_PALETTE, DEFAULT_TEXT_STYLE} from './styles.js';
import {CategoryWidget} from './category-widget.js';

const DEFAULT_PIE_GRID = {
  left: 0,
  right: '4px',
  top: '8px',
  bottom: '24px',
  width: 'auto',
  height: 'auto',
};

export class PieWidget extends CategoryWidget {
  protected override async _updateChart() {
    if (this._task.status === TaskStatus.ERROR) {
      return;
    }

    const categories = await this._task.taskComplete;
    categories.sort((a, b) => (a.value > b.value ? -1 : 1));

    const data = categories.map(({name, value}, index) => {
      let color = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
      if (this._filterValues.length > 0) {
        color = this._filterValues.includes(name) ? color : '#cccccc';
      }
      return {value, name, itemStyle: {color}};
    });

    this._chart!.setOption({
      xAxis: {data: data.map(({name}) => name)},
      yAxis: {type: 'value'},
      series: [{type: 'pie', radius: ['40%', '70%'], name: this.header, data}],
      // Confine tooltip to the chart bounds, so it doesn't clip at sidebar scroll rect.
      tooltip: {confine: true},
      grid: DEFAULT_PIE_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}
