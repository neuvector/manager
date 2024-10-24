import { RolePermission } from './rolePermission';

export interface UserRoleConfig {
  name: string;
  comment: string;
  permissions: RolePermission[];
}
