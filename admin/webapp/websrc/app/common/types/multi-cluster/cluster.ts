export interface Cluster {
  id: string;
  name: string;
  username: string;
  status: string; //ClusterStatus
  api_server: string;
  api_port: number;
  clusterType: string;
}
