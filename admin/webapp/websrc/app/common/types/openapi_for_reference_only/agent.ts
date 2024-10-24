import { AgentLabels } from './agentLabels';

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  host_name: string;
  host_id: string;
  version: string;
  labels: AgentLabels;
  domain: string;
  pid_mode: string;
  network_mode: string;
  created_at: string;
  started_at: string;
  joined_at: string;
  memory_limit: number;
  cpus: string;
  cluster_ip: string;
  connection_state: string;
  disconnected_at: string;
}
