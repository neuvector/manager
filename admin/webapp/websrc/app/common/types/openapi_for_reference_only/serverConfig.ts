import { ServerOIDCConfig } from "./serverOIDCConfig";
import { ServerSAMLConfig } from "./serverSAMLConfig";
import { ServerLDAPConfig } from "./serverLDAPConfig";

export interface ServerConfig {
  name: string;
  ldap?: ServerLDAPConfig;
  saml?: ServerSAMLConfig;
  oidc?: ServerOIDCConfig;
}
