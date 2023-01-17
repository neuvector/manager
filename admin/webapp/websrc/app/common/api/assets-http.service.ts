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
import { pluck } from 'rxjs/operators';

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
      .get<Workload[]>(PathConstant.CONTAINER_URL)
      .pipe(pluck('workloads')) as Observable<Workload[]>;
  }

  getScannedContainers(start: number, limit: number): Observable<WorkloadV2[]> {
    return GlobalVariable.http.get<WorkloadV2[]>(
      PathConstant.SCANNED_CONTAINER_URL,
      {
        params: { start, limit },
      }
    ) as Observable<WorkloadV2[]>;
  }

  getContainerStats(id: string): Observable<SystemStatsData> {
    return GlobalVariable.http.get<SystemStatsData>(
      PathConstant.CONTAINER_URL,
      {
        params: { id },
      }
    ) as Observable<SystemStatsData>;
  }

  getWorkloadReport(
    id: string,
    isShowingAccepted: boolean
  ): Observable<Vulnerability[]> {
    const params = (
      isShowingAccepted ? { id, show: 'accepted' } : { id }
    ) as any;
    return GlobalVariable.http
      .get<Vulnerability[]>(PathConstant.SCAN_URL, {
        params,
      })
      .pipe(pluck('report', 'vulnerabilities')) as Observable<Vulnerability[]>;
  }

  getHostReport(
    id: string,
    isShowingAccepted: boolean
  ): Observable<Vulnerability[]> {
    const params = (
      isShowingAccepted ? { id, show: 'accepted' } : { id }
    ) as any;
    return GlobalVariable.http
      .get<Vulnerability[]>(PathConstant.SCAN_HOST_URL, { params })
      .pipe(pluck('report', 'vulnerabilities')) as Observable<Vulnerability[]>;
  }

  getPlatformReport(
    platform: string,
    isShowingAccepted: boolean
  ): Observable<Vulnerability[]> {
    const params = (
      isShowingAccepted ? { platform, show: 'accepted' } : { platform }
    ) as any;
    return GlobalVariable.http
      .get<Vulnerability[]>(PathConstant.SCAN_PLATFORM_URL, { params })
      .pipe(pluck('report', 'vulnerabilities')) as Observable<Vulnerability[]>;
  }

  getNodeWorkloads(id: string): Observable<Workload[]> {
    return GlobalVariable.http
      .get<Workload[]>(PathConstant.NODE_WORKLOADS_URL, { params: { id } })
      .pipe(pluck('workloads')) as Observable<Workload[]>;
  }

  getProcess(id: string): Observable<ProcessInfo[]> {
    return GlobalVariable.http
      .get<ProcessInfo>(PathConstant.CONTAINER_PROCESS_URL, {
        params: { id },
      })
      .pipe(pluck('processes')) as Observable<ProcessInfo[]>;
  }

  getProcessHistory(id: string): Observable<ProcessInfo[]> {
    return GlobalVariable.http
      .get(PathConstant.CONTAINER_PROCESS_HISTORY_URL, {
        params: { id },
      })
      .pipe(pluck('processes')) as Observable<ProcessInfo[]>;
  }

  getScanConfig(): Observable<ScanConfig> {
    return GlobalVariable.http
      .get<ScanConfig>(PathConstant.SCAN_CONFIG_URL)
      .pipe(pluck('config')) as Observable<ScanConfig>;
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
      .get<Controller[]>(PathConstant.CONTROLLER_URL)
      .pipe(pluck('controllers')) as Observable<Controller[]>;
  }

  getControllerStats(id: string): Observable<SystemStatsData> {
    return GlobalVariable.http.get<SystemStatsData>(
      PathConstant.CONTROLLER_URL,
      { params: { id } }
    ) as Observable<SystemStatsData>;
  }

  getEnforcers(): Observable<Enforcer[]> {
    return GlobalVariable.http
      .get<Enforcer[]>(PathConstant.ENFORCER_URL)
      .pipe(pluck('enforcers')) as Observable<Enforcer[]>;
  }

  getEnforcerStats(id: string): Observable<SystemStatsData> {
    return GlobalVariable.http.get<SystemStatsData>(PathConstant.ENFORCER_URL, {
      params: { id },
    }) as Observable<SystemStatsData>;
  }

  getScanners(): Observable<Scanner[]> {
    return GlobalVariable.http
      .get<Scanner[]>(PathConstant.SCANNER_URL)
      .pipe(pluck('scanners')) as Observable<Scanner[]>;
  }
}
