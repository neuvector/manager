export interface ScanStatus {
  scanned: number;
  scheduled: number;
  scanning: number;
  failed: number;
  cvedb_version: string;
  cvedb_create_time: string;
}
