export interface ScanPlatformSummary {
  platform: string;
  kube_version: string;
  openshift_version: string;
  status: string;
  critical: number;
  high: number;
  medium: number;
  result: string;
  scanned_timestamp: number;
  scanned_at: string;
  base_os: string;
  scanner_version: string;
  cvedb_create_time: string;
}
