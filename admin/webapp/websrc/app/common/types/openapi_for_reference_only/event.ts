import { EventUserRoles } from './eventUserRoles';

export interface Event {
  name?: string;
  level: string;
  reported_timestamp: number;
  reported_at: string;
  cluster_name: string;
  response_rule_id?: number;
  host_id: string;
  host_name: string;
  enforcer_id: string;
  enforcer_name: string;
  controller_id: string;
  controller_name: string;
  workload_id: string;
  workload_name: string;
  workload_domain: string;
  workload_image: string;
  workload_service: string;
  category: string;
  user: string;
  user_roles: EventUserRoles;
  user_addr: string;
  user_session: string;
  rest_method?: string;
  rest_request?: string;
  rest_body?: string;
  enforcer_limit?: number;
  license_expire?: string;
  message: string;
}
