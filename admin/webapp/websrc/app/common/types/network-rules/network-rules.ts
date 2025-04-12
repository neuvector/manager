export interface NetworkRule {
  id: number;
  comment: string;
  from: string;
  to: string;
  applications: Array<string>;
  ports: string;
  action: string;
  cfg_type: string;
  disable: boolean;
  created_timestamp: number;
  last_modified_timestamp: number;
  learned: boolean;
  priority: number;
  match_counter: number;
  last_match_timestamp: number;
  state?: string;
  remove?: boolean;
  selected?: boolean;
}
