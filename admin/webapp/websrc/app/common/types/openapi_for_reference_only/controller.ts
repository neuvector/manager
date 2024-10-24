import { ControllerLabels } from './controllerLabels';

export interface Controller {
  id: string;
  name: string;
  display_name: string;
  host_name: string;
  host_id: string;
  version: string;
  labels: ControllerLabels;
  domain: string;
  created_at: string;
  started_at: string;
  joined_at: string;
  memory_limit: number;
  cpus: string;
  cluster_ip: string;
  leader: boolean;
  connection_state: string;
  disconnected_at: string;
  orch_conn_status: string;
  orch_conn_last_error: string;
}
