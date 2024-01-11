export * from './workloadsData';
export * from './hostsData';
export * from './host';
export * from './workload';
export * from './hostData';
export * from './workloadData';
export * from './workloadCompliance';
export * from './platform';
export * from './complainceProfile';
export * from './complianceNIST';

export interface Compliance {
  category: string;
  description: string;
  group: string;
  images: IdName[];
  level: string;
  message: string[];
  name: string;
  nodes: IdName[];
  platforms: IdName[];
  profile: string;
  remediation: string;
  scored: boolean;
  tags: string[];
  type: string;
  domains: string[];
  workloads: IdName[];
  filteredWorkloads: IdName[];
  filteredImages: IdName[];
}

export interface ComplianceRaw {
  category: string;
  description: string;
  group: string;
  images: string[];
  level: string;
  message: string[];
  name: string;
  nodes: string[];
  platforms: string[];
  profile: string;
  remediation: string;
  scored: boolean;
  tags: string[];
  type: string;
  workloads: string[];
}

export interface IdName {
  id: string;
  display_name: string;
  policy_mode: string;
  domains: string[];
  service?: string;
  image?: string;
}

export interface ComplianceData {
  compliances: ComplianceRaw[] | Compliance[];
  nodes: { [key: string]: IdName[] };
  platforms: { [key: string]: IdName[] };
  images: { [key: string]: IdName[] };
  workloads: { [key: string]: IdName[] };
  docker_cis_version: string;
  kubernetes_cis_category: string;
  kubernetes_cis_version: string;
}
