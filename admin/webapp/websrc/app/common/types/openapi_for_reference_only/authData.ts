import { AuthPassword } from "./authPassword";
import { AuthToken } from "./authToken";

export interface AuthData {
  client_ip: string;
  password?: AuthPassword;
  Token?: AuthToken;
}
