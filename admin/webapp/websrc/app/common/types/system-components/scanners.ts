export interface Scanner {
  id: string;
  cvedb_version: string;
  cvedb_create_time: string;
  joined_timestamp: number;
  port: number;
  scanned_containers: number;
  scanned_hosts: number;
  scanned_images: number;
  scanned_serverless: number;
  server: string;
}
