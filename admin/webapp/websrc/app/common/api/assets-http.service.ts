import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import {
  Controller,
  DomainGetResponse,
  Enforcer,
  HostData,
  HostsData,
  ProcessInfo,
  ScanConfig,
  Scanner,
  SystemStatsData,
  Vulnerability,
  Workload,
  WorkloadData,
  WorkloadsData,
  WorkloadV2,
} from '@common/types';
import { PathConstant } from '@common/constants/path.constant';
import { PlatformsData } from '@common/types/compliance/platformsData';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface WorkloadResponse {
  workloads: Workload[];
}

interface VulnerabilityReportResponse {
  report: {
    vulnerabilities: Vulnerability[];
  };
}

interface ProcessInfoResponse {
  processes: ProcessInfo[];
}

interface ConfigResponse {
  config: ScanConfig;
}

interface ControllerResponse {
  controllers: Controller[];
}

interface EnforcerResponse {
  enforcers: Enforcer[];
}

interface ScannerResponse {
  scanners: Scanner[];
}

@Injectable()
export class AssetsHttpService {
  getContainerBriefById(id: string) {
    return GlobalVariable.http.get<WorkloadData>(
      PathConstant.PLAIN_CONTAINER_URL,
      {
        params: {
          id,
        },
      }
    );
  }

  getContainerBrief() {
    return GlobalVariable.http.get<WorkloadsData>(
      PathConstant.PLAIN_CONTAINER_URL
    );
  }

  getContainers(): Observable<Workload[]> {
    return GlobalVariable.http
      .get<WorkloadResponse>(PathConstant.CONTAINER_URL)
      .pipe(map(r => r.workloads));
  }

  getScannedContainers(start: number, limit: number): Observable<WorkloadV2[]> {
    return GlobalVariable.http.get<WorkloadV2[]>(
      PathConstant.SCANNED_CONTAINER_URL,
      {
        params: { start, limit },
      }
    );
  }

  getContainerStats(id: string): Observable<SystemStatsData> {
    return GlobalVariable.http.get<SystemStatsData>(
      PathConstant.CONTAINER_URL,
      {
        params: { id },
      }
    );
  }

  getWorkloadReport(
    id: string,
    isShowingAccepted: boolean
  ): Observable<Vulnerability[]> {
    const params = (
      isShowingAccepted ? { id, show: 'accepted' } : { id }
    ) as any;
    return GlobalVariable.http
      .get<VulnerabilityReportResponse>(PathConstant.SCAN_URL, {
        params,
      })
      .pipe(map(r => r.report.vulnerabilities));
  }

  getHostReport(
    id: string,
    isShowingAccepted: boolean
  ): Observable<Vulnerability[]> {
    const params = (
      isShowingAccepted ? { id, show: 'accepted' } : { id }
    ) as any;
    return GlobalVariable.http
      .get<VulnerabilityReportResponse>(PathConstant.SCAN_HOST_URL, { params })
      .pipe(map(r => r.report.vulnerabilities));
  }

  getPlatformReport(
    platform: string,
    isShowingAccepted: boolean
  ): Observable<Vulnerability[]> {
    const params = (
      isShowingAccepted ? { platform, show: 'accepted' } : { platform }
    ) as any;
    return GlobalVariable.http
      .get<VulnerabilityReportResponse>(PathConstant.SCAN_PLATFORM_URL, { params })
      .pipe(map(r => r.report.vulnerabilities));
  }

  getNodeWorkloads(id: string): Observable<Workload[]> {
    return GlobalVariable.http
      .get<WorkloadResponse>(PathConstant.NODE_WORKLOADS_URL, { params: { id } })
      .pipe(map(r => r.workloads));
  }

  getProcess(id: string): Observable<ProcessInfo[]> {
    return GlobalVariable.http
      .get<ProcessInfoResponse>(PathConstant.CONTAINER_PROCESS_URL, {
        params: { id },
      })
      .pipe(map(r => r.processes));
  }

  getProcessHistory(id: string): Observable<ProcessInfo[]> {
    return GlobalVariable.http
      .get<ProcessInfoResponse>(PathConstant.CONTAINER_PROCESS_HISTORY_URL, {
        params: { id },
      })
      .pipe(map(r => r.processes));
  }

  getScanConfig(): Observable<ScanConfig> {
    return GlobalVariable.http
      .get<ConfigResponse>(PathConstant.SCAN_CONFIG_URL)
      .pipe(map(r => r.config));
  }

  postScanConfig(config: ScanConfig): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.SCAN_CONFIG_URL, {
      config,
    });
  }

  postScanContainer(id: string): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(
      PathConstant.SCAN_CONTAINER_URL,
      id
    );
  }

  postScanNode(id: string): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.SCAN_HOST_URL, id);
  }

  postScanPlatform(id: string): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(
      PathConstant.SCAN_PLATFORM_URL,
      id
    );
  }

  getNodeBriefById(id: string) {
    return GlobalVariable.http.get<HostData>(PathConstant.NODES_URL, {
      params: {
        id,
      },
    });
  }

  getNodeBrief() {
    return GlobalVariable.http.get<HostsData>(PathConstant.NODES_URL);
  }

  getPlatform() {
    return GlobalVariable.http.get<PlatformsData>(
      PathConstant.SCAN_PLATFORM_URL
    );
  }

  getDomain() {
    return GlobalVariable.http.get<DomainGetResponse>(PathConstant.DOMAIN_URL);
  }

  patchDomain(payload) {
    return GlobalVariable.http.patch<DomainGetResponse>(
      PathConstant.DOMAIN_URL,
      payload
    );
  }

  postDomain(payload) {
    return GlobalVariable.http.post<unknown>(PathConstant.DOMAIN_URL, payload);
  }

  getControllers(): Observable<Controller[]> {
    return GlobalVariable.http
      .get<ControllerResponse>(PathConstant.CONTROLLER_URL)
      .pipe(map(r => r.controllers));
  }

  getControllerStats(id: string): Observable<SystemStatsData> {
    return GlobalVariable.http.get<SystemStatsData>(
      PathConstant.CONTROLLER_URL,
      { params: { id } }
    );
  }

  getEnforcers(): Observable<Enforcer[]> {
    return GlobalVariable.http
      .get<EnforcerResponse>(PathConstant.ENFORCER_URL)
      .pipe(map(r => r.enforcers));
  }

  getEnforcerStats(id: string): Observable<SystemStatsData> {
    return GlobalVariable.http.get<SystemStatsData>(PathConstant.ENFORCER_URL, {
      params: { id },
    });
  }

  getScanners(): Observable<Scanner[]> {
    return GlobalVariable.http
      .get<ScannerResponse>(PathConstant.SCANNER_URL)
      .pipe(map(r => r.scanners));
  }
}
