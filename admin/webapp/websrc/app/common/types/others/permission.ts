export class Permission {
  id: string;
  read: boolean;
  write: boolean;
}

export interface PermissionOption {
  id: string;
  read_supported: boolean;
  write_supported: boolean;
}

export interface PermissionOptionResponse {
  domain_options: PermissionOption[];
  global_options: PermissionOption[];
}
