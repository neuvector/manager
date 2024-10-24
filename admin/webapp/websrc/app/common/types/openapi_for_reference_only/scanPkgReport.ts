import { Vulnerability } from './vulnerability';

export interface ScanPkgReport {
  verdict: string;
  message: string;
  cvedb_version: string;
  cvedb_create_time: string;
  vulnerabilities: Vulnerability[];
}
