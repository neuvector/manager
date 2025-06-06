// Generated by ScalaTS 0.5.9: https://scala-ts.github.io/scala-ts/

import { Array, isArray } from './Array';

export interface UsersOutput {
  domain_roles?: Array;
  global_roles?: Array;
  users: Array;
}

export function isUsersOutput(v: any): v is UsersOutput {
  return (
    (!v['domain_roles'] || (v['domain_roles'] && isArray(v['domain_roles']))) &&
    (!v['global_roles'] || (v['global_roles'] && isArray(v['global_roles']))) &&
    v['users'] &&
    isArray(v['users'])
  );
}
