import { Permission } from '..';

export * from './config';

export interface LicenseGetResponse {
  info: LicenseInfo;
  day_to_expire: number;
}

export interface LicenseInfo {
  name: string;
  email: string;
  phone: string;
  id?: string;
  id_type?: string;
  licence_type?: string;
  license_model: string;
  instance_id: string;
  instance_key: string;
  issue: string;
  expire: string;
  installation_id: string;
  grace_period?: number;
  node_limit: number;
  cpu_limit?: number;
  multi_cluster_limit?: number;
  scan: boolean;
  enforce: boolean;
  serverless: boolean;
}

export interface RenewLicensePostBody {
  license_key: string;
}

export interface SelfGetResponse {
  emailHash: string;
  token: Self;
}

export interface Self {
  default_password: boolean;
  domain_permissions: object;
  email: string;
  fullname: string;
  global_permissions: object[];
  locale: string;
  modify_password: boolean;
  password_days_until_expire: number;
  password: string;
  new_password: string;
  role: string;
  server: string;
  timeout: number;
  token: string;
  username: string;
}

export interface GroupMappedRole {
  group: string;
  global_role: string;
  role_domains: {
    [key: string]: string[];
  };
}

export interface LDAP {
  base_dn: string;
  bind_dn: string;
  bind_password: string;
  default_role: string;
  directory: string;
  enable: boolean;
  group_mapped_roles: GroupMappedRole[];
  group_member_attr: string;
  hostname: string;
  port: number;
  ssl: boolean;
  username_attr: string;
}

export interface SAML {
  sso_url: string;
  issuer: string;
  x509_cert: string;
  group_claim: string;
  default_role: string;
  group_mapped_roles: GroupMappedRole[];
  enable: boolean;
}

export interface OPENID {
  default_role: string;
  issuer: string;
  client_id: string;
  client_secret: string;
  group_claim: string;
  scopes: string[];
  group_mapped_roles: GroupMappedRole[];
  enable: boolean;
  authorization_endpoint?: string;
  token_endpoint?: string;
  user_info_endpoint?: string;
}

export interface Server {
  server_type: string;
  server_name: string;
  ldap?: LDAP;
  saml?: SAML;
  oidc?: OPENID;
}

export interface MappableRoles {
  default_roles: string[];
  group_domain_roles: string[];
  group_roles: string[];
}

export interface ServerGetResponse {
  mappable_roles: MappableRoles;
  servers: Server[];
}

export interface ServerPatchBody {
  config: {
    name: string;
    ldap?: LDAP;
    saml?: SAML;
    oidc?: OPENID;
  };
}

export interface UserGetResponse {
  domain_roles: string[];
  global_roles: string[];
  users: User[];
}

export interface User {
  username: string;
  server: string;
  role_domains: Object;
  role: string;
  password: string;
  modify_password: boolean;
  locale: string;
  fullname: string;
  email: string;
  emailHash: string;
  default_password: boolean;
  blocked_for_failed_login: boolean;
  blocked_for_password_expired: boolean;
}

export interface Domain {
  name: string;
  running_pods: number;
  running_workloads: number;
  services: number;
  tags: string[];
  workloads: number;
}

export interface DomainGetResponse {
  domains: Domain[];
  tag_per_domain: boolean;
}

export interface DebugPostBody {
  test: {
    name: string;
    ldap: LDAP;
    test_ldap: {
      username: string;
      password: string;
    };
  };
}

export interface Role {
  comment: string;
  name: string;
  permissions: Permission[];
  reserved?: boolean;
}

export interface PasswordProfile extends PublicPasswordProfile {
  block_after_failed_login_count: number;
  block_minutes: number;
  comment: string;
  enable_block_after_failed_login: boolean;
  enable_password_expiration: boolean;
  enable_password_history: boolean;
  name: string;
  password_expire_after_days: number;
  password_keep_history_count: number;
}

export interface PublicPasswordProfile {
  min_digit_count: number;
  min_len: number;
  min_lowercase_count: number;
  min_special_count: number;
  min_uppercase_count: number;
}
