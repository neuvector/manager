export interface ProcessInfo {
  name: string;
  pid: number;
  parent: number;
  group: number;
  session: number;
  cmdline: string;
  root: boolean;
  user: string;
  status: string;
  start_timestamp: number;
  action: string;
}
