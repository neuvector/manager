export interface Cluster {
  disabled: boolean;
  name: string;
  id: string;
  secret: string;
  api_server: string;
  api_port: number;
  status: string; //ClusterStatus
  username: string;
  rest_version: string;
  clusterType: string;
  proxy_required: boolean;
  component_versions: string[];
}
