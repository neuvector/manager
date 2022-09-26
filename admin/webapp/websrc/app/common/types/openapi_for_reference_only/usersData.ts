import { User } from "./user";

export interface UsersData {
  users: User[];
  global_roles: string[];
  domain_roles: string[];
}
