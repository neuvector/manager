import { ModuleCve } from "./moduleCve";

export interface ScanModule {
  name: string;
  version: string;
  source: string;
  cves?: ModuleCve[];
  cpes?: string[];
}
