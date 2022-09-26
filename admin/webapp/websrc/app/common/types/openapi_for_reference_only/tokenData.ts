import { Token } from "./token";

export interface TokenData {
  token: Token;
  password_days_until_expire: number;
  password_hours_until_expire: number;
}
