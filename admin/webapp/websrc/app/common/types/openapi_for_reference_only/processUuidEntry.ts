import { ProcessProfileEntry } from "./processProfileEntry";

export interface ProcessUuidEntry {
  active?: number;
  group?: string;
  rule?: ProcessProfileEntry;
}
