import {Filter} from '@carto/api-client';

export interface FilterEvent extends CustomEvent {
  detail: {filters: Record<string, Filter>};
}
