export interface ComplianceNISTConfig {
  names: string[];
}

export interface ComplianceNIST {
  name: string;
  subcontrol: string;
  control_id: string;
  title: string;
}

export interface ComplianceNISTMap {
  nist_map: {
    [key: string]: ComplianceNIST;
  };
}
