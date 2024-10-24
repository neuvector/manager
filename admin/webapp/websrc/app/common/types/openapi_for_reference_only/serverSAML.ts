import { ServerLDAPRoleGroups } from './serverLDAPRoleGroups';
import { GroupRoleMapping } from './groupRoleMapping';

export interface ServerSAML {
  sso_url: string;
  issuer: string;
  x509_cert?: string;
  group_claim: string;
  enable: boolean;
  default_role: string;
  role_groups?: ServerLDAPRoleGroups;
  group_mapped_roles?: GroupRoleMapping[];
}
