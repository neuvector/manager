import { RolePermission } from './rolePermission';

export interface UserRole {
  name: string;
  comment: string;
  reserved: boolean;
  permissions: RolePermission[];
}
