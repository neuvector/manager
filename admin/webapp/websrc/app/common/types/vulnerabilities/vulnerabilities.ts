import {
  CfgType,
  Compliance,
  IdName,
  LastModifiedDateOption,
  MatchTypeOption,
  VulnerabilityView,
  VulQueryPackageTypeOption,
  VulQueryPublishedTimeOption,
  VulQueryScoreTypeOption,
  VulQuerySeverityTypeOption,
} from '@common/types';
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
  feed_rating: string;
  packages: VulnerabilityAssetPackages;
  link: string;
  score: number;
  score_v3: number;
  vectors: string;
  vectors_v3: string;
  published_timestamp: number;
  last_modified_timestamp: number;
  workloads: IdName[];
  nodes: IdName[];
  images: IdName[];
  platforms: IdName[];
  // to remove
  filteredWorkloads: IdName[];
  filteredImages: IdName[];
}

export interface VulnerabilityQuery {
  last_modified_timestamp?: number;
  last_modified_timestamp_option?: LastModifiedDateOption;
  publishedType?: VulQueryPublishedTimeOption;
  publishedTime?: number;
  packageType?: VulQueryPackageTypeOption;
  severityType?: VulQuerySeverityTypeOption;
  scoreType?: VulQueryScoreTypeOption;
  scoreV2?: number[];
  scoreV3?: number[];
  matchTypeService?: MatchTypeOption;
  serviceName?: string;
  matchTypeNs?: MatchTypeOption;
  selectedDomains?: string[];
  matchTypeImage?: MatchTypeOption;
  imageName?: string;
  matchTypeNode?: MatchTypeOption;
  nodeName?: string;
  matchTypeContainer?: MatchTypeOption;
  containerName?: string;
  viewType: VulnerabilityView;
}

export interface VulnerabilitiesQuerySessionData {
  qf_matched_records: number;
  vulnerabilities: VulnerabilityAsset[];
}

export interface VulnerabilitiesQueryData {
  query_token: string;
  summary: VulnerabilitiesQuerySummary;
  total_matched_records: number;
  total_records: number;
}

export interface VulnerabilitiesQuerySummary {
  count_distribution: VulnerabilitiesQuerySummaryDistribution;
  top_images: VulnerabilitiesQuerySummaryTopAsset[];
  top_nodes: VulnerabilitiesQuerySummaryTopAsset[];
}

export interface VulnerabilitiesQuerySummaryTopAsset {
  index: number;
  display_name: string;
  high: number;
  medium: number;
  low: number;
}

export interface VulnerabilitiesQuerySummaryDistribution {
  high: number;
  medium: number;
  low: number;
  container: number;
  image: number;
  node: number;
  platform: number;
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
