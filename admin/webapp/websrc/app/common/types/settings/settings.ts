import { Permission } from '..';

export * from './config';
export * from './remote-repository';

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
  remote_global_permissions: object[];
  extra_permissions: object[];
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
  base_dn?: string | null | undefined;
  group_dn?: string | null | undefined;
  bind_dn?: string | null | undefined;
  bind_password?: string | null | undefined;
  default_role?: string | null | undefined;
  directory?: string | null | undefined;
  enable?: boolean | null | undefined;
  group_mapped_roles?: GroupMappedRole[] | null | undefined;
  group_member_attr?: string | null | undefined;
  hostname?: string | null | undefined;
  port?: number | null | undefined;
  ssl?: boolean | null | undefined;
  username_attr?: string | null | undefined;
}

export interface SAMLGetResponse extends SAML {
  x509_certs: X509Cert[];
}

export interface SAMLPatch extends SAML {
  x509_cert_extra: string[];
}

export interface SAML {
  sso_url?: string | null | undefined;
  issuer?: string | null | undefined;
  x509_cert?: string | null | undefined;
  group_claim?: string | null | undefined;
  default_role?: string | null | undefined;
  group_mapped_roles?: GroupMappedRole[] | null | undefined;
  enable?: boolean | null | undefined;
  authn_signing_enabled?: boolean | null | undefined;
  slo_enabled?: boolean | null | undefined;
  slo_url?: string | null | undefined;
  signing_cert?: string | null | undefined;
  signing_key?: string | null | undefined;
}

export interface X509Cert {
  x509_cert: string;
  issuer_cn: string;
  subject_cn: string;
  subject_notafter: number;
}

export interface OPENID {
  default_role?: string | null | undefined;
  issuer?: string | null | undefined;
  client_id?: string | null | undefined;
  client_secret?: string | null | undefined;
  group_claim?: string | null | undefined;
  scopes?: string[] | null | undefined;
  group_mapped_roles?: GroupMappedRole[] | null | undefined;
  enable?: boolean | null | undefined;
  authorization_endpoint?: string | null | undefined;
  token_endpoint?: string | null | undefined;
  user_info_endpoint?: string | null | undefined;
}

export interface Server {
  server_type: string;
  server_name: string;
  ldap?: LDAP;
  saml?: SAMLGetResponse;
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
    saml?: SAMLPatch;
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
  password_resettable: boolean;
  blocked_for_failed_login: boolean;
  blocked_for_password_expired: boolean;
  extra_permissions?: any[];
  extra_permissions_domains?: any[];
}

export interface Domain {
  name: string;
  running_pods: number;
  running_workloads: number;
  services: number;
  tags: string[];
  workloads: number;
  labels: DomainLabels;
  nbe: boolean;
}

export interface DomainLabels {
  [key: string]: string;
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
      username?: string | null | undefined;
      password?: string | null | undefined;
    };
  };
}

export interface Role {
  comment: string;
  name: string;
  permissions: Permission[];
  reserved?: boolean;
}

export type ApikeyExpiration =
  | 'never'
  | 'onehour'
  | 'oneday'
  | 'onemonth'
  | 'oneyear'
  | 'hours';

export interface Apikey {
  expiration_type: ApikeyExpiration;
  expiration_hours: number;
  apikey_name: string;
  description: string;
  role: string;
  role_domains: {
    [key: string]: string[];
  };
  expiration_timestamp?: number;
  created_timestamp?: number;
  created_by_entity?: number;
}

export interface ApikeyInit {
  apikey_name: string;
  apikey_secret: string;
}

export interface ApikeyGetResponse {
  apikeys: Apikey[];
  global_roles: string[];
  domain_roles: string[];
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
  session_timeout: number;
}

export interface PublicPasswordProfile {
  min_digit_count: number;
  min_len: number;
  min_lowercase_count: number;
  min_special_count: number;
  min_uppercase_count: number;
}

export interface UsageReport {
  telemetry_status: TelemetryStatus;
  usage: Usage[];
}

export interface Usage {
  adm_ctrl_rules: number;
  clusters: number;
  controllers: number;
  cores: number;
  crd_rules: number;
  cvedb_version: string;
  domains: number;
  enforcers: number;
  groups: number;
  hosts: number;
  installation_id: string;
  monitor_groups: number;
  platform: string;
  policy_rules: number;
  protect_groups: number;
  registries: number;
  reported_at: string;
  reported_timestamp: number;
  response_rules: number;
  running_pods: number;
  scanners: number;
  signature: string;
  sl_projs: number;
}

export interface TelemetryStatus {
  current_version: string;
  last_telemetry_upload_time: string;
  max_upgrade_version: UpgradeVersion;
  min_upgrade_version: UpgradeVersion;
  telemetry_freq: number;
  telemetry_url: string;
}

export interface UpgradeVersion {
  release_date: string;
  tag: string;
  version: string;
}
