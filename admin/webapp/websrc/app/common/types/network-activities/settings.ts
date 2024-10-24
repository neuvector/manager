import { AdvancedFilter } from './advancedFilter';

export interface Settings {
  showSysNode: boolean;
  showSysApp: boolean;
  showLegend?: boolean;
  hiddenDomains: string[];
  hiddenGroups: string[];
  persistent: boolean;
  gpuEnabled: boolean;
}

export interface GraphSettings {
  advFilter: AdvancedFilter;
  settings: Settings;
}
