import { ProcessProfileEntry } from './processProfileEntry';

export interface ProcessProfile {
  group: string;
  alert_disabled?: boolean;
  hash_enabled?: boolean;
  mode: string;
  process_list: ProcessProfileEntry[];
}
