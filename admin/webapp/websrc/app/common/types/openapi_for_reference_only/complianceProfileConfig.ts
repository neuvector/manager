import { ComplianceProfileEntry } from './complianceProfileEntry';

export interface ComplianceProfileConfig {
  name: string;
  disable_system?: boolean;
  entries?: ComplianceProfileEntry[];
}
