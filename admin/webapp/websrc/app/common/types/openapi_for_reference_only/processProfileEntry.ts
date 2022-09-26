export interface ProcessProfileEntry {
  name: string;
  path?: string;
  user?: string;
  uid?: number;
  action: string;
  cfg_type: string;
  uuid: string;
  group?: string;
  created_timestamp: number;
  last_modified_timestamp: number;
}
