import { ServerLDAPRoleGroups } from "./serverLDAPRoleGroups";
import { GroupRoleMapping } from "./groupRoleMapping";

export interface ServerOIDCConfig {
  issuer: string;
  client_id: string;
  client_secret?: string;
  group_claim: string;
  scopes?: string[];
  enable: boolean;
  default_role: string;
  role_groups?: ServerLDAPRoleGroups;
  group_mapped_roles?: GroupRoleMapping[];
}
