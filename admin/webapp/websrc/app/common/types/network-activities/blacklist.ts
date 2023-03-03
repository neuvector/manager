export interface GraphItem {
  name: string;
}

export interface GraphEndpoint {
  name: string;
  id: string;
}

export interface GroupItem {
  name: string;
  displayName: string;
}

export interface Blacklist {
  domains: GraphItem[];
  groups: GroupItem[];
  endpoints: GraphEndpoint[];
  hideUnmanaged: boolean;
}
