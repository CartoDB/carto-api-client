import {customElement, property} from 'lit/decorators.js';
import {TaskStatus} from '@lit/task';
import {
  DEFAULT_CATEGORY_GRID,
  DEFAULT_PALETTE,
  DEFAULT_TEXT_STYLE,
} from './styles';

import {CategoryWidget} from '..';

@customElement('pie-widget')
export class PieWidget extends CategoryWidget {
  @property()
  override caption = 'Pie widget';

  protected override async _updateChart() {
    if (this._categoryTask.status === TaskStatus.ERROR) {
      return;
    }

    const categories = await this._categoryTask.taskComplete;
    categories.sort((a, b) => (a.value > b.value ? -1 : 1));

    const data = categories.map(({name, value}, index) => {
      let color = DEFAULT_PALETTE[index]; // TODO: >8 categories allowed?
      if (this.filterValues.length > 0) {
        color = this.filterValues.includes(name) ? color : '#cccccc';
      }
      return {value, name, itemStyle: {color}};
    });

    this.chart.setOption({
      xAxis: {data: data.map(({name}) => name)},
      yAxis: {type: 'value'},
      series: [{type: 'pie', radius: ['40%', '70%'], name: this.header, data}],
      tooltip: {},
      grid: DEFAULT_CATEGORY_GRID,
      textStyle: DEFAULT_TEXT_STYLE,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-widget': PieWidget;
  }
}
