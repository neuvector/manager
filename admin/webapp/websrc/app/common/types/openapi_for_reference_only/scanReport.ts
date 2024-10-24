import { ScanReportLabels } from './scanReportLabels';
import { Vulnerability } from './vulnerability';
import { BenchItem } from './benchItem';
import { ScanSecret } from './scanSecret';
import { ScanSetIdPerm } from './scanSetIdPerm';
import { ScanModule } from './scanModule';

export interface ScanReport {
  vulnerabilities: Vulnerability[];
  modules?: ScanModule[];
  checks?: BenchItem[];
  secrets?: ScanSecret[];
  setid_perms?: ScanSetIdPerm[];
  envs?: string[];
  labels?: ScanReportLabels;
  cmds?: string[];
}
