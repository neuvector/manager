export interface Platform {
  base_os: string;
  cvedb_create_time: string;
  critical: number;
  high: number;
  kube_version: string;
  medium: number;
  openshift_version: string;
  platform: string;
  result: string;
  scanned_at: string;
  scanned_timestamp: number;
  scanner_version: string;
  status: string;
}
