import { GroupRoleMappingRoleDomains } from './groupRoleMappingRoleDomains';

export interface UserConfig {
  fullname: string;
  password?: string;
  new_password?: string;
  pwd_profile: string;
  email?: string;
  role?: string;
  timeout?: number;
  locale?: string;
  role_domains?: GroupRoleMappingRoleDomains;
}
