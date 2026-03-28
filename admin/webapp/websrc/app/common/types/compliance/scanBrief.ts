export interface ScanBrief {
  status: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  result: string;
  scanned_timestamp: number;
  scanned_at: string;
  base_os: string;
  scanner_version: string;
  cvedb_create_time: string;
}
