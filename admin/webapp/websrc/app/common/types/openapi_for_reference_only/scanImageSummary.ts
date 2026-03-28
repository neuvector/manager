export interface ScanImageSummary {
  image: string;
  image_id: string;
  author: string;
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
