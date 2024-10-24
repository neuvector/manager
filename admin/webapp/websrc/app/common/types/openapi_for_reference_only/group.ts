import { CriteriaEntry } from './criteriaEntry';
import { WorkloadBrief } from './workloadBrief';

export interface Group {
  name: string;
  learned: boolean;
  reserved: boolean;
  policy_mode?: string;
  domain: string;
  creater_domains: string[];
  kind: string;
  platform_role: string;
  cap_change_mode: boolean;
  criteria: CriteriaEntry[];
  members: WorkloadBrief[];
  policy_rules: number[];
  response_rules: number[];
}
