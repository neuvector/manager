import { ServerLDAPRoleGroups } from "./serverLDAPRoleGroups";
import { GroupRoleMapping } from "./groupRoleMapping";

export interface ServerOIDC {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  user_info_endpoint: string;
  client_id: string;
  ClientSecret?: string;
  group_claim: string;
  scopes: string[];
  enable: boolean;
  default_role: string;
  role_groups?: ServerLDAPRoleGroups;
  group_mapped_roles?: GroupRoleMapping[];
}
