import { ScanMeta } from "./scanMeta";

export interface ScanRepoReq {
  metadata: ScanMeta;
  registry: string;
  username?: string;
  password?: string;
  repository: string;
  tag: string;
  scan_layers: boolean;
  base_image: string;
}
