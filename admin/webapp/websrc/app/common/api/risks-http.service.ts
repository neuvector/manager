import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import {
  ComplianceData,
  ComplianceNISTConfig,
  ComplianceNISTMap,
  ComplianceProfileData,
  ComplianceProfileTemplateData,
  VulnerabilityProfile,
  VulnerabilityProfileEntry,
  VulnerabilityProfilesData,
  WorkloadCompliance,
} from '@common/types';
import { PathConstant } from '@common/constants/path.constant';
import { VulnerabilitiesData } from '@common/types/vulnerabilities/vulnerabilities';
import { Observable } from 'rxjs';

@Injectable()
export class RisksHttpService {
  getCompliance(): Observable<ComplianceData> {
    return GlobalVariable.http.get<ComplianceData>(
      PathConstant.RISK_COMPLIANCE_URL
    );
  }

  postComplianceNIST(
    config: ComplianceNISTConfig
  ): Observable<ComplianceNISTMap> {
    return GlobalVariable.http.post<ComplianceNISTMap>(
      PathConstant.RISK_COMPLIANCE_NIST_URL,
      {
        config,
      }
    );
  }

  getVulnerabilities() {
    return GlobalVariable.http.get<VulnerabilitiesData>(
      PathConstant.RISK_CVE_URL
    );
  }

  getNodeCompliance(id: string): Observable<WorkloadCompliance> {
    return GlobalVariable.http.get<WorkloadCompliance>(
      PathConstant.NODE_COMPLIANCE_URL,
      { params: { id } }
    );
  }

  getContainerCompliance(id: string): Observable<WorkloadCompliance> {
    return GlobalVariable.http.get<WorkloadCompliance>(
      PathConstant.CONTAINER_COMPLIANCE_URL,
      { params: { id } }
    );
  }

  getCVEProfile(): Observable<VulnerabilityProfilesData> {
    return GlobalVariable.http.get<VulnerabilityProfilesData>(
      PathConstant.CVE_PROFILE
    );
  }

  postCVEProfile(config: VulnerabilityProfile): Observable<unknown> {
    return GlobalVariable.http.post(PathConstant.CVE_PROFILE_ENTRY, {
      config,
    });
  }

  patchCVEProfile(
    config: VulnerabilityProfileEntry,
    name: string
  ): Observable<unknown> {
    return GlobalVariable.http.patch(
      PathConstant.CVE_PROFILE_ENTRY,
      { config },
      { params: { name } }
    );
  }

  deleteCVEProfile(
    profile_name: string,
    entry_id: string
  ): Observable<unknown> {
    return GlobalVariable.http.delete(PathConstant.CVE_PROFILE_ENTRY, {
      params: { entry_id, profile_name },
    });
  }

  exportCVEProfile(names: string[]) {
    return GlobalVariable.http.post(
      PathConstant.EXPORT_CVE_PROFILE,
      { names },
      { observe: 'response', responseType: 'text' }
    );
  }

  getComplianceProfile(): Observable<ComplianceProfileData> {
    return GlobalVariable.http.get<ComplianceProfileData>(
      PathConstant.COMPLIANCE_PROFILE_URL
    );
  }

  patchComplianceProfile(payload) {
    return GlobalVariable.http.patch<ComplianceProfileData>(
      PathConstant.COMPLIANCE_PROFILE_URL,
      payload
    );
  }

  getComplianceProfileTemplate(): Observable<ComplianceProfileTemplateData> {
    return GlobalVariable.http.get<ComplianceProfileTemplateData>(
      PathConstant.COMPLIANCE_TEMPLATE_URL
    );
  }
}
