import { HostInterfaces } from './hostInterfaces';
import { WorkloadLabels } from './workloadLabels';
import { WorkloadBrief } from './workloadBrief';
import { WorkloadPorts } from './workloadPorts';

export interface Workload extends WorkloadBrief {
  app_ports: any;
  images: string[];
  children: Workload[];
  host_name: string;
  host_id: string;
  enforcer_id: string;
  enforcer_name: string;
  network_mode: string;
  created_at: string;
  started_at: string;
  finished_at: string;
  running: boolean;
  secured_at: string;
  exit_code: number;
  interfaces: HostInterfaces;
  ports: WorkloadPorts[];
  labels: WorkloadLabels;
  applications: string[];
  memory_limit: number;
  cpus: string;
}
