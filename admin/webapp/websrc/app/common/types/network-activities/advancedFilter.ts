export interface PolicyMode {
  discover: boolean;
  monitor: boolean;
  protect: boolean;
}

export interface Protocol {
  tcp: boolean;
  udp: boolean;
  icmp: boolean;
}

export interface AdvancedFilter {
  domains: string[],
  groups: string[],
  policyMode: PolicyMode;
  cve: string;
  protocol: Protocol;
  risk: string;
}
