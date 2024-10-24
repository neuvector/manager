import { ComplianceProfileEntry } from './complianceProfileEntry';

export interface ComplianceProfile {
  name: string;
  disable_system: boolean;
  entries: ComplianceProfileEntry[];
}
