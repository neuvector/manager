export interface FileMonitorFile {
  path: string;
  mask: number;
  is_dir: boolean;
  protect: boolean;
  files: string[];
}
