export interface EventItem {
  category: string;
  cluster_name: string;
  controller_id: string;
  controller_name: string;
  enforcer_id: string;
  enforcer_name: string;
  host_id: string;
  host_name: string;
  level: string;
  message: string;
  name: string;
  reported_at: string;
  reported_timestamp: number;
  user: string;
  user_addr: string;
  user_roles: Object;
  user_session: string;
  workload_domain: string;
  workload_id: string;
  workload_image: string;
  workload_name: string;
  workload_service: string;
}
