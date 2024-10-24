import { ServerLDAP } from './serverLDAP';
import { ServerOIDC } from './serverOIDC';
import { ServerSAML } from './serverSAML';

export interface Server {
  server_name: string;
  server_type: string;
  ldap?: ServerLDAP;
  saml?: ServerSAML;
  oidc?: ServerOIDC;
}
