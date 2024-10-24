import { GroupRoleMappingRoleDomains } from './groupRoleMappingRoleDomains';

export interface GroupRoleMapping {
  group: string;
  global_role: string;
  role_domains?: GroupRoleMappingRoleDomains;
}
