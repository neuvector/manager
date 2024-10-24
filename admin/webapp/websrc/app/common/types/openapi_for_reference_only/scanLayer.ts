import { Vulnerability } from './vulnerability';

export interface ScanLayer {
  digest: string;
  cmds: string;
  vulnerabilities: Vulnerability[];
  size: number;
}
