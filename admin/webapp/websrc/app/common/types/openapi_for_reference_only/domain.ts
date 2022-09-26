export interface Domain {
  name: string;
  workloads: number;
  running_workloads: number;
  running_pods: number;
  services: number;
  tags: string[];
}
