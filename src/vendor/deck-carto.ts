export enum FilterTypes {
  In = 'in',
  Between = 'between', // [a, b] both are included
  ClosedOpen = 'closed_open', // [a, b) a is included, b is not
  Time = 'time',
  StringSearch = 'stringSearch'
}

export interface Filter {
  [FilterTypes.In]: number[];
  [FilterTypes.Between]: number[][];
  [FilterTypes.ClosedOpen]: number[][];
  [FilterTypes.Time]: number[][];
  [FilterTypes.StringSearch]: string[];
}
