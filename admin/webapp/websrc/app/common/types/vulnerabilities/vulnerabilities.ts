import { CfgType, Compliance, IdName } from '@common/types';
import { VulnerabilityAssetPackages } from '@common/types/openapi_for_reference_only/vulnerabilityAssetPackages';
import { VulnPackageVersion } from '@common/types/openapi_for_reference_only/vulnPackageVersion';

export interface VulnerabilityAssetRaw {
  name: string;
  severity: string;
  description: string;
  packages?: VulnerabilityAssetPackages;
  package_name: string;
  link: string;
  score: number;
  vectors: string;
  score_v3: number;
  vectors_v3: string;
  published_timestamp: number;
  last_modified_timestamp: number;
  package_versions: VulnPackageVersion[];
  workloads: string[];
  nodes: string[];
  images: string[];
  platforms: string[];
}

export interface VulnerabilityAsset {
  name: string;
  severity: string;
  description: string;
  packages?: VulnerabilityAssetPackages;
  package_name: string;
  link: string;
  score: number;
  vectors: string;
  score_v3: number;
  vectors_v3: string;
  published_timestamp: number;
  last_modified_timestamp: number;
  package_versions: VulnPackageVersion[];
  workloads: IdName[];
  nodes: IdName[];
  images: IdName[];
  platforms: IdName[];
  filteredWorkloads: IdName[];
  filteredImages: IdName[];
}

export interface VulnerabilitiesData {
  vulnerabilities: VulnerabilityAssetRaw[] | Compliance[];
  nodes: { [key: string]: IdName[] };
  platforms: { [key: string]: IdName[] };
  images: { [key: string]: IdName[] };
  workloads: { [key: string]: IdName[] };
}

export interface VulnerabilityProfile {
  name: string;
  entries: VulnerabilityProfileEntry[];
  cfg_type?: CfgType;
}

export interface VulnerabilityProfileEntry {
  id?: number;
  name: string;
  comment: string;
  days: number;
  domains: string[];
  images: string[];
}

export interface VulnerabilityProfilesData {
  profiles: VulnerabilityProfile[];
}
