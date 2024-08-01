import { AtmoConfig, AuthConfig, IBMSAConfig, IBMSetupGetResponse, MiscConfig, NetConfig, ProxyConfig, ScannerAutoscale, SvcConfig, SyslogConfig, Webhook } from "./config";
import { RemoteRepository } from "./remote-repository";

export interface ConfigV2Vo {
  new_svc: SvcConfig;
  syslog: SyslogConfig;
  auth: AuthConfig;
  misc: MiscConfig;
  webhooks: Webhook[];
  remote_repositories: RemoteRepository[];
  proxy: ProxyConfig;
  ibmsa: IBMSAConfig;
  net_svc: NetConfig;
  mode_auto: AtmoConfig;
  tls: TlsConfigVo;
  scanner_autoscale: ScannerAutoscale;
  duration_toggle?: boolean;
  ibmsa_setup?: IBMSetupGetResponse;
  ibmsa_ep_start?: number;
}

export interface TlsConfigVo {
  enable_tls_verification: boolean;
  cacerts: CaCertVo[];
}

export interface CaCertVo {
  id: number;
  context: string;
  isEditable?: boolean;
}