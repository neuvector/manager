export interface ImportTask {
  tid: string;
  ctrler_id: string;
  last_update_time?: string;
  percentage: number;
  triggered_by?: string;
  status?: string;
  temp_token?: string;
}
