import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RisksHttpService } from '@common/api/risks-http.service';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { catchError, map, repeatWhen, tap } from 'rxjs/operators';
import {
  Compliance,
  HostData,
  HostsData,
  VulnerabilityProfile,
  VulnerabilityAssetRaw,
  Workload,
  WorkloadsData,
  CfgType,
} from '@common/types';
import { PlatformsData } from '@common/types/compliance/platformsData';
import { setRisks, sortByDisplayName } from '@common/utils/common.utils';
import { VulnerabilitiesData } from '@common/types/vulnerabilities/vulnerabilities';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { MapConstant } from '@common/constants/map.constant';
import { GridApi } from 'ag-grid-community';

@Injectable()
export class VulnerabilitiesService {
  imageMap!: Map<string, { high: number; medium: number; low: number }>;
  hostMap!: Map<string, { high: number; medium: number; low: number }>;
  topNodes!: [string, { high: number; medium: number; low: number }][];
  topImages!: [string, { high: number; medium: number; low: number }][];
  topCve!: Compliance[] | VulnerabilityAssetRaw[];
  gridApi!: GridApi;
  countDistribution!: {
    high: number;
    medium: number;
    low: number;
    platform: number;
    image: number;
    node: number;
    container: number;
  };
  private countDistributionSubject$ = new Subject();
  countDistribution$ = this.countDistributionSubject$.asObservable();
  workloadMap4Pdf!: {};
  private workloadMap!: Map<string, any>;
  imageMap4Pdf!: {};
  platformMap4Pdf!: {};
  hostMap4Pdf!: {};
  private refreshSubject$ = new Subject();
  private selectedVulnerabilitySubject$ = new BehaviorSubject<any>(undefined);
  selectedVulnerability$ = this.selectedVulnerabilitySubject$.asObservable();

  constructor(
    private datePipe: DatePipe,
    private risksHttpService: RisksHttpService,
    private vulnerabilitiesFilterService: VulnerabilitiesFilterService,
    private assetsHttpService: AssetsHttpService,
    private assetsViewPdfService: AssetsViewPdfService
  ) {}

  selectVulnerability(vulnerability) {
    this.selectedVulnerabilitySubject$.next(vulnerability);
  }

  transformDate(date) {
    return this.datePipe.transform(date, 'MMM dd, y HH:mm:ss');
  }

  initVulnerabilityDetails() {
    this.selectedVulnerabilitySubject$.next(undefined);
    this.imageMap = new Map();
    this.hostMap = new Map();
    this.topCve = [];
    this.topNodes = [];
    this.topImages = [];
    this.countDistribution = {
      high: 0,
      medium: 0,
      low: 0,
      platform: 0,
      image: 0,
      node: 0,
      container: 0,
    };
    this.workloadMap4Pdf = {};
    this.workloadMap = new Map();
    this.imageMap4Pdf = {};
    this.platformMap4Pdf = {};
    this.hostMap4Pdf = {};
  }

  updateCountDistribution(filteredCis) {
    let countDistribution = {
      high: 0,
      medium: 0,
      low: 0,
      platform: 0,
      image: 0,
      node: 0,
      container: 0,
    };
    filteredCis.forEach(cve => {
      if (cve.severity === 'High') countDistribution.high += 1;
      if (cve.severity === 'Medium') countDistribution.medium += 1;
      if (cve.severity === 'Low') countDistribution.low += 1;
      if (cve.platforms.length) countDistribution.platform += 1;
      if (cve.images.length) countDistribution.image += 1;
      if (cve.nodes.length) countDistribution.node += 1;
      if (cve.workloads.length) countDistribution.container += 1;
    });
    this.countDistribution = countDistribution;
    this.countDistributionSubject$.next();
  }

  initVulnerability() {
    this.initVulnerabilityDetails();
    return combineLatest([
      this.getDomain(),
      this.getContainer(),
      this.getHost(),
      this.getPlatform(),
      this.getVulnerabilities(),
    ]).pipe(
      map(([domain, container, host, platform, vulnerabilities]) => {
        return {
          domain,
          container,
          host,
          platform,
          vulnerabilities,
        };
      }),
      tap(({ vulnerabilities: { vulnerabilities } }) => {
        this.vulnerabilitiesFilterService.workloadMap = this.workloadMap;
        setRisks(vulnerabilities, this.workloadMap);
        this.assetsViewPdfService.masterData = {
          workloadMap4Pdf: this.workloadMap4Pdf,
          hostMap4Pdf: this.hostMap4Pdf,
          platformMap4Pdf: this.platformMap4Pdf,
          imageMap4Pdf: this.imageMap4Pdf,
        };
        this.vulnerabilitiesFilterService.resetFilter();
        this.vulnerabilitiesFilterService.filtered = false;
        this.vulnerabilitiesFilterService.filteredCis = vulnerabilities;
      }),
      repeatWhen(() => this.refreshSubject$)
    );
  }

  refresh() {
    this.refreshSubject$.next(true);
  }

  getNodeBrief(id: string): Observable<HostData> {
    return this.assetsHttpService.getNodeBriefById(id);
  }

  getContainerBrief(id: string): Observable<Workload> {
    return this.assetsHttpService.getContainerBriefById(id).pipe(
      map(workloadData => {
        let container = workloadData.workload;
        if (
          workloadData.workload.labels &&
          workloadData.workload.labels['io.kubernetes.container.name'] === 'POD'
        ) {
          container.images = [];
        } else {
          container.images = [workloadData.workload.image];
        }
        if (container.children && container.children.length > 0) {
          container.children.forEach(function (child) {
            container.images.push(child.image);
          });
        }
        return container;
      })
    );
  }

  compareImpact = (cve1, cve2) => {
    if (cve1.platforms.length === cve2.platforms.length) {
      if (cve1.images.length === cve2.images.length) {
        if (cve1.nodes.length === cve2.nodes.length) {
          return cve1.workloads.length - cve2.workloads.length;
        } else return cve1.nodes.length - cve2.nodes.length;
      } else return cve1.images.length - cve2.images.length;
    } else {
      return cve1.platforms.length - cve2.platforms.length;
    }
  };

  acceptVulnerability(profile: VulnerabilityProfile) {
    return this.risksHttpService.postCVEProfile(profile);
  }

  getProfileType(): Observable<CfgType> {
    return this.risksHttpService.getCVEProfile().pipe(
      map(profile => {
        return profile.profiles[0].cfg_type || '';
      })
    );
  }

  getAssetsViewReportData(queryToken: string, lastModifiedTime: number): Observable<any> {
    return this.risksHttpService.postAssetsViewData(queryToken, lastModifiedTime).pipe();
  }

  private getDomain(): Observable<String[]> {
    return this.assetsHttpService.getDomain().pipe(
      map(data => {
        return data.domains
          .map(domain => domain.name)
          .filter(domain => domain.charAt(0) !== '_');
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of([]);
        } else {
          throw err;
        }
      })
    );
  }

  private getContainer(): Observable<WorkloadsData> {
    return this.assetsHttpService.getContainerBrief().pipe(
      tap(data => {
        data.workloads.forEach(workload => {
          this.workloadMap.set(workload.id, workload);
          this.workloadMap4Pdf[workload.id] = {
            id: workload.id,
            pod_id: workload.id || '',
            pod_name:
              workload.display_name || workload.pod_name || workload.name,
            domain: workload.domain || '',
            applications: workload.applications || [],
            policy_mode: workload.policy_mode || '',
            service: workload.service || '',
            service_group: workload.service_group || '',
            image_id: workload.image_id,
            image: workload.image,
            scanned_at: workload.scan_summary
              ? this.transformDate(workload.scan_summary.scanned_at)
              : '',
            high: 0,
            medium: 0,
            low: 0,
            evaluation: 0, //0: compliant, 1: risky
            complianceCnt: 0,
            vulnerabilites: [],
            complianceList: [],
          };
          if (workload.state !== 'exit') {
            if (workload.children) {
              workload.children.forEach(child => {
                let containerInfo = JSON.parse(JSON.stringify(workload));
                containerInfo.image_id = child.image_id;
                containerInfo.image = child.image;
                this.workloadMap.set(child.id, containerInfo);
                this.workloadMap4Pdf[child.id] = {
                  id: child.id,
                  pod_id: workload.id || '',
                  pod_name:
                    workload.display_name || workload.pod_name || workload.name,
                  domain: workload.domain || '',
                  applications: workload.applications || [],
                  policy_mode: workload.policy_mode || '',
                  service: workload.service || '',
                  service_group: workload.service_group || '',
                  image: child.image,
                  scanned_at: workload.scan_summary
                    ? this.transformDate(workload.scan_summary.scanned_at)
                    : '',
                  high: 0,
                  medium: 0,
                  low: 0,
                  evaluation: 0, //0: compliant, 1: risky
                  complianceCnt: 0,
                  vulnerabilites: [],
                  complianceList: [],
                };
                this.imageMap4Pdf[child.image_id] = {
                  workloadId: child.id,
                  image_id: child.image_id,
                  image_name: child.image,
                  high: 0,
                  medium: 0,
                  low: 0,
                  evaluation: 0, //0: compliant, 1: risky
                  complianceCnt: 0,
                  vulnerabilites: [],
                  complianceList: [],
                };
              });
            }
          }
        });
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({ workloads: [] });
        } else {
          throw err;
        }
      })
    );
  }

  private getHost(): Observable<HostsData> {
    return this.assetsHttpService.getNodeBrief().pipe(
      tap(data => {
        data.hosts.forEach(host => {
          this.hostMap4Pdf[host.id] = {
            id: host.id,
            name: host.name,
            containers: host.containers,
            cpus: host.cpus,
            memory: host.memory,
            os: host.os || '',
            kernel: host.kernel || '',
            policy_mode: host.policy_mode || '',
            scanned_at: host.scan_summary
              ? this.transformDate(host.scan_summary.scanned_at)
              : '',
            high: 0,
            medium: 0,
            low: 0,
            evaluation: 0, //0: compliant, 1: risky
            complianceCnt: 0,
            vulnerabilites: [],
            complianceList: [],
          };
        });
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({ hosts: [] });
        } else {
          throw err;
        }
      })
    );
  }

  private getPlatform(): Observable<PlatformsData> {
    return this.assetsHttpService.getPlatform().pipe(
      tap(data => {
        data.platforms.forEach(platform => {
          this.platformMap4Pdf[platform.platform] = {
            platform: platform.platform,
            base_os: platform.base_os || '',
            kube_version: platform.kube_version || '',
            openshift_version: platform.openshift_version || '',
            high: 0,
            medium: 0,
            low: 0,
            complianceCnt: 0,
            vulnerabilites: [],
            complianceList: [],
          };
        });
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({ platforms: [] });
        } else {
          throw err;
        }
      })
    );
  }

  private getVulnerabilities(): Observable<VulnerabilitiesData> {
    return this.risksHttpService.getVulnerabilities().pipe(
      map(vulnerabilityData => {
        vulnerabilityData.vulnerabilities.forEach(vulnerability => {
          let domains = new Set();
          vulnerability.nodes = vulnerability.nodes.map(nodeId => {
            vulnerabilityData.nodes[nodeId][0].id = nodeId;
            vulnerabilityData.nodes[nodeId][0].domains?.forEach(domain => {
              domains.add(domain);
            });
            return vulnerabilityData.nodes[nodeId][0];
          });
          vulnerability.workloads = vulnerability.workloads.map(workloadId => {
            vulnerabilityData.workloads[workloadId][0].id = workloadId;
            vulnerabilityData.workloads[workloadId][0].domains?.forEach(
              domain => {
                domains.add(domain);
              }
            );
            return vulnerabilityData.workloads[workloadId][0];
          });
          vulnerability.platforms = vulnerability.platforms.map(platformId => {
            vulnerabilityData.platforms[platformId][0].id = platformId;
            vulnerabilityData.platforms[platformId][0].domains?.forEach(
              domain => {
                domains.add(domain);
              }
            );
            return vulnerabilityData.platforms[platformId][0];
          });
          vulnerability.images = vulnerability.images.map(imageId => {
            vulnerabilityData.images[imageId][0].id = imageId;
            vulnerabilityData.images[imageId][0].domains?.forEach(domain => {
              domains.add(domain);
            });
            return vulnerabilityData.images[imageId][0];
          });
          vulnerability.domains = [...domains];
          vulnerability.images.sort(sortByDisplayName);
          vulnerability.workloads.sort(sortByDisplayName);
          vulnerability.nodes.sort(sortByDisplayName);
          vulnerability.platforms.sort(sortByDisplayName);
        });
        return vulnerabilityData;
      }),
      tap(({ vulnerabilities }) => {
        vulnerabilities.forEach(cve => {
          if (cve.nodes.length > 0) {
            cve.nodes.forEach(host => {
              let exist = this.hostMap.get(host.display_name);
              if (!exist)
                this.hostMap.set(host.display_name, {
                  high: cve.severity === 'High' ? 1 : 0,
                  medium: cve.severity === 'Medium' ? 1 : 0,
                  low: cve.severity === 'Low' ? 1 : 0,
                });
              else {
                switch (cve.severity) {
                  case 'High':
                    exist.high += 1;
                    this.hostMap.set(host.display_name, exist);
                    break;
                  case 'Medium':
                    exist.medium += 1;
                    this.hostMap.set(host.display_name, exist);
                    break;
                  case 'Low':
                    exist.low += 1;
                    this.hostMap.set(host.display_name, exist);
                    break;
                  default:
                    break;
                }
              }
            });
          }
          if (cve.images.length > 0) {
            cve.images.forEach(image => {
              let exist = this.imageMap.get(image.display_name);
              if (!exist)
                this.imageMap.set(image.display_name, {
                  high: cve.severity === 'High' ? 1 : 0,
                  medium: cve.severity === 'Medium' ? 1 : 0,
                  low: cve.severity === 'Low' ? 1 : 0,
                });
              else {
                switch (cve.severity) {
                  case 'High':
                    exist.high += 1;
                    this.imageMap.set(image.display_name, exist);
                    break;
                  case 'Medium':
                    exist.medium += 1;
                    this.imageMap.set(image.display_name, exist);
                    break;
                  case 'Low':
                    exist.low += 1;
                    this.imageMap.set(image.display_name, exist);
                    break;
                  default:
                    break;
                }
              }
            });
            this.countDistribution.image += 1;
          }
          if (cve.severity === 'High') this.countDistribution.high += 1;
          if (cve.severity === 'Medium') this.countDistribution.medium += 1;
          if (cve.severity === 'Low') this.countDistribution.low += 1;
          if (cve.platforms.length) this.countDistribution.platform += 1;
          if (cve.nodes.length) this.countDistribution.node += 1;
          if (cve.workloads.length) this.countDistribution.container += 1;
        });
        this.topNodes = [...this.hostMap]
          .sort((a, b) => {
            if (a[1].high === b[1].high && a[1].medium === b[1].medium) {
              return b[1].low - a[1].low;
            } else if (a[1].high === b[1].high) {
              return b[1].medium - a[1].medium;
            } else return b[1].high - a[1].high;
          })
          .slice(0, 5);
        this.topImages = [...this.imageMap]
          .sort((a, b) => {
            if (a[1].high === b[1].high && a[1].medium === b[1].medium) {
              return b[1].low - a[1].low;
            } else if (a[1].high === b[1].high) {
              return b[1].medium - a[1].medium;
            } else return b[1].high - a[1].high;
          })
          .slice(0, 5);
        this.topCve = vulnerabilities
          .sort((a, b) => this.compareImpact(a, b) * -1)
          .slice(0, 5);
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({
            vulnerabilities: [],
            nodes: {},
            platforms: {},
            images: {},
            workloads: {},
          });
        } else {
          throw err;
        }
      })
    );
  }
}
