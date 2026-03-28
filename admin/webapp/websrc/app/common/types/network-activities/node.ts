export interface Fixed {
  x: boolean;
  y: boolean;
}

export interface ScanBrief {
  status: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SubNode {
  id: string;
  label: string;
  scanBrief?: ScanBrief;
  sidecar?: boolean;
}

export interface Node {
  id: string;
  label: string;
  group: string;
  clusterId: string;
  clusterName: string;
  scanBrief?: ScanBrief;
  cve?: any;
  platform_role: string;
  state: string;
  domain: string;
  cap_quarantine: boolean;
  cap_change_mode: boolean;
  cap_sniff: boolean;
  service_mesh?: boolean;
  service_mesh_sidecar?: boolean;
  children?: SubNode[];
  policyMode?: string;
  x?: number;
  y?: number;
  fixed?: Fixed;
}
