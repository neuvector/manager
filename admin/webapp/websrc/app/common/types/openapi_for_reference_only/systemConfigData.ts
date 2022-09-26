import { SystemConfig } from "./systemConfig";
import { FedSystemConfig } from "./fedSystemConfig";

export interface SystemConfigData {
  config: SystemConfig;
  fed_config: FedSystemConfig;
}
