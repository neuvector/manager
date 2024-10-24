import { GroupRoleMappingRoleDomains } from './groupRoleMappingRoleDomains';

export interface Token {
  token: string;
  fullname: string;
  server: string;
  username: string;
  password: string;
  email: string;
  role: string;
  timeout: number;
  locale: string;
  default_password: boolean;
  modify_password: boolean;
  role_domains?: GroupRoleMappingRoleDomains;
  last_login_timestamp: number;
  last_login_at: string;
  login_count: number;
}
