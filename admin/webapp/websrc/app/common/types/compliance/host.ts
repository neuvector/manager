import { HostInterfaces } from './hostInterfaces';
import { HostLabels } from './hostLabels';
import { HostAnnotations } from './hostAnnotations';
import { ScanBrief } from './scanBrief';

export interface Host {
  name: string;
  id: string;
  runtime: string;
  runtime_version: string;
  runtime_api_version: string;
  platform: string;
  os: string;
  kernel: string;
  cpus: number;
  memory: number;
  cgroup_version: number;
  containers: number;
  interfaces: HostInterfaces;
  state: string;
  cap_docker_bench: boolean;
  cap_kube_bench: boolean;
  docker_bench_status?: string;
  kube_bench_status?: string;
  policy_mode: string;
  profile_mode: string;
  scan_summary: ScanBrief;
  storage_driver: string;
  labels: HostLabels;
  annotations: HostAnnotations;
}
