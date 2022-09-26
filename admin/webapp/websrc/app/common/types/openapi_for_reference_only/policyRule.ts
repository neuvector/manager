export interface PolicyRule {
  id: number;
  comment: string;
  /**
   * group name
   */
  from: string;
  /**
   * group name
   */
  to: string;
  /**
   * free-style port list
   */
  ports: string;
  action: string;
  applications: string[];
  learned: boolean;
  disable: boolean;
  created_timestamp: number;
  last_modified_timestamp: number;
  cfg_type: string;
  priority: number;
}
