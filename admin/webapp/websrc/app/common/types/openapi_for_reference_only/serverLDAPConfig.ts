import { ServerLDAPRoleGroups } from './serverLDAPRoleGroups';
import { GroupRoleMapping } from './groupRoleMapping';

export interface ServerLDAPConfig {
  directory?: string;
  hostname?: string;
  port?: number;
  ssl?: boolean;
  base_dn?: string;
  bind_dn?: string;
  bind_password?: string;
  group_member_attr?: string;
  username_attr?: string;
  enable?: boolean;
  default_role?: string;
  role_groups?: ServerLDAPRoleGroups;
  group_mapped_roles?: GroupRoleMapping[];
}
