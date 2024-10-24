import { MappableRoles } from './mappableRoles';
import { Server } from './server';

export interface ServersData {
  servers: Server[];
  mappable_role?: MappableRoles;
}
