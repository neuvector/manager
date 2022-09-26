export interface ComplianceProfile {
  name: string;
  disable_system: boolean;
  entries: complianceProfileEntries[];
}

export interface complianceProfileEntries {
  tags: string[];
  test_number: string;
}

export interface ComplianceProfileData {
  profiles: ComplianceProfile[];
}

export interface ComplianceProfileTemplate {
  name: string;
  disable_system: boolean;
  entries: complianceProfileEntries[];
}

export interface ComplianceProfileTemplateData {
  list: ComplianceProfileTemplateEntries;
}

export interface ComplianceProfileTemplateEntries {
  compliance: ComplianceProfileTemplateEntry[];
}

export interface ComplianceProfileTemplateEntry {
  automated: boolean;
  category: string;
  description: string;
  profile: string;
  remediation: string;
  scored: boolean;
  tags: string[];
  test_number: string;
  type: string;
}
