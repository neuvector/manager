import { Workload } from '..';
import { ScanResult } from './scanResult';

export interface PodDetails {
  workload: Workload;
  risk: ScanResult;
}
