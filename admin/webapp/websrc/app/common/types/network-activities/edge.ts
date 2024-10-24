export interface Edge {
  id?: string;
  source: string;
  target: string;
  label?: string;
  status: string;
  fromGroup?: string;
  toGroup?: string;
  fromDomain?: string;
  toDomain?: string;
  protocols?: string[];
  applications?: string[];
  event_type?: string[];
  sidecar_proxy?: boolean;
  bytes: number;
}
