import { ScanAppPackage } from './scanAppPackage';

export interface ScanPackageReqData {
  source: string;
  user: string;
  job: string;
  workspace: string;
  _function: string;
  region: string;
  application_packages: ScanAppPackage[];
}
