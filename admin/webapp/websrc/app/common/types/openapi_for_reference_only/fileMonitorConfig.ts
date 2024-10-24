import { FileMonitorFilterConfig } from './fileMonitorFilterConfig';

export interface FileMonitorConfig {
  add_filters?: FileMonitorFilterConfig[];
  delete_filters?: FileMonitorFilterConfig[];
  update_filters?: FileMonitorFilterConfig[];
}
