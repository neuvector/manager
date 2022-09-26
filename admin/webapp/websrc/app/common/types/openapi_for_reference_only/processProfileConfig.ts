import { ProcessProfileEntryConfig } from "./processProfileEntryConfig";

export interface ProcessProfileConfig {
  group: string;
  alert_disabled?: boolean;
  hash_enabled?: boolean;
  process_change_list?: ProcessProfileEntryConfig[];
  process_delete_list?: ProcessProfileEntryConfig[];
  process_replace_list?: ProcessProfileEntryConfig[];
}
