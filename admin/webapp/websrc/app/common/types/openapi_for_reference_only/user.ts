import { GroupRoleMappingRoleDomains } from './groupRoleMappingRoleDomains';

export interface User {
  fullname: string;
  server: string;
  username: string;
  password?: string;
  email: string;
  role: string;
  timeout: number;
  locale: string;
  /**
   * If the user is using default password
   */
  default_password: boolean;
  /**
   * If the password should be modified
   */
  modify_password: boolean;
  role_domains?: GroupRoleMappingRoleDomains;
  last_login_timestamp: number;
  last_login_at: string;
  login_count: number;
  blocked_for_failed_login: boolean;
  blocked_for_password_expired: boolean;
}
