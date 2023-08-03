import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, map, repeatWhen, tap } from 'rxjs/operators';
import {
  Compliance,
  ComplianceData,
  ComplianceNIST,
  ComplianceNISTConfig,
  ComplianceNISTMap,
  HostData,
  HostsData,
  Workload,
  WorkloadsData,
} from '@common/types';
import { PlatformsData } from '@common/types/compliance/platformsData';
import { DatePipe } from '@angular/common';
import { ComplianceFilterService } from './compliance.filter.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { setRisks, sortByDisplayName } from '@common/utils/common.utils';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { MapConstant } from '@common/constants/map.constant';
import { GridApi } from 'ag-grid-community';

@Injectable()
export class ComplianceService {
  kubeVersion!: string;
  workloadMap4Pdf!: {};
  private workloadMap!: Map<string, any>;
  complianceNISTMap!: {};
  imageMap4Pdf!: {};
  platformMap4Pdf!: {};
  hostMap4Pdf!: {};
  gridApi!: GridApi;
  private refreshSubject$ = new Subject();
  private selectedComplianceSubject$ = new BehaviorSubject<any | undefined>(
    undefined
  );
  selectedCompliance$ = this.selectedComplianceSubject$.asObservable();

  constructor(
    private datePipe: DatePipe,
    private risksHttpService: RisksHttpService,
    private assetsHttpService: AssetsHttpService,
    private complianceFilterService: ComplianceFilterService,
    private assetsViewPdfService: AssetsViewPdfService
  ) {}

  transformDate(date) {
    return this.datePipe.transform(date, 'MMM dd, y HH:mm:ss');
  }

  // runWorkers() {
  //   this.assetsViewPdfService.runWorker();
  //   this.complianceViewPdfService.runWorker();
  // }

  initComplianceDetails() {
    this.selectedComplianceSubject$.next(undefined);
    this.workloadMap4Pdf = {};
    this.workloadMap = new Map();
    this.complianceNISTMap = {};
    this.imageMap4Pdf = {};
    this.platformMap4Pdf = {};
    this.hostMap4Pdf = {};
  }

  initCompliance() {
    this.initComplianceDetails();
    return combineLatest([
      this.getDomain(),
      this.getContainer(),
      this.getHost(),
      this.getPlatform(),
      this.getCompliance(),
    ]).pipe(
      map(([domain, container, host, platform, compliance]) => {
        const complianceDist = {
          error: 0,
          high: 0,
          warning: 0,
          note: 0,
          pass: 0,
          info: 0,
          platform: 0,
          image: 0,
          node: 0,
          container: 0,
        };
        compliance.compliances.forEach(compliance => {
          if (compliance.level === 'WARN') complianceDist.warning += 1;
          if (compliance.level === 'INFO') complianceDist.info += 1;
          if (compliance.level === 'PASS') complianceDist.pass += 1;
          if (compliance.level === 'NOTE') complianceDist.note += 1;
          if (compliance.level === 'ERROR') complianceDist.error += 1;
          if (compliance.level === 'HIGH') complianceDist.high += 1;
          if (compliance.platforms.length) complianceDist.platform += 1;
          if (compliance.images.length) complianceDist.image += 1;
          if (compliance.nodes.length) complianceDist.node += 1;
          if (compliance.workloads.length) complianceDist.container += 1;
        });
        compliance = this.mapWorkloadService(compliance, this.workloadMap);
        return {
          domain,
          container,
          host,
          platform,
          compliance,
          complianceDist,
        };
      }),
      tap(({ compliance: { compliances, kubernetes_cis_version } }) => {
        this.postComplianceNIST({
          names: compliances.map(c => c.name),
        }).subscribe(nistMap => {
          this.complianceNISTMap = nistMap.nist_map;
        });
        this.kubeVersion = kubernetes_cis_version;
        this.complianceFilterService.workloadMap = this.workloadMap;
        setRisks(compliances, this.workloadMap);
        this.assetsViewPdfService.masterData = {
          workloadMap4Pdf: this.workloadMap4Pdf,
          hostMap4Pdf: this.hostMap4Pdf,
          platformMap4Pdf: this.platformMap4Pdf,
          imageMap4Pdf: this.imageMap4Pdf,
        };
        if (this.complianceFilterService.isAdvFilterOn()) {
          this.complianceFilterService.resetFilter(
            this.complianceFilterService.advFilter
          );
          this.complianceFilterService.filtered = true;
        } else {
          this.complianceFilterService.resetFilter();
          this.complianceFilterService.filtered = false;
        }
        this.complianceFilterService.filteredCis = compliances;
      }),
      // finalize(() => {
      //   this.runWorkers();
      // }),
      repeatWhen(() => this.refreshSubject$)
    );
  }

  private mapWorkloadService(compliance, workloadMap) {
    let compliances = compliance.compliances.map(item => {
      let services: Set<any> = new Set();
      item.workloads.forEach(workload => {
        let workloadDetails = workloadMap.get(workload.id);
        services.add(workloadDetails.service);
      });
      item.services = Array.from(services);
      return item;
    });
    compliance.compliances = compliances;
    return compliance;
  }

  refresh() {
    this.refreshSubject$.next(true);
  }

  selectCompliance(compliance: Compliance) {
    this.selectedComplianceSubject$.next(compliance);
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
            evaluation: 0, //0: compliant, 1: risky
            complianceCnt: 0,
            vulnerabilites: [],
            complianceList: [],
          };
          if (workload.state !== 'exit') {
            this.imageMap4Pdf[workload.image_id] = {
              image_id: workload.image_id,
              image_name: workload.image,
              high: 0,
              medium: 0,
              evaluation: 0, //0: compliant, 1: risky
              complianceCnt: 0,
              vulnerabilites: [],
              complianceList: [],
            };
            if (workload.children) {
              workload.children.forEach(child => {
                this.workloadMap.set(child.id, workload);
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
                  image: workload.image,
                  scanned_at: workload.scan_summary
                    ? this.transformDate(workload.scan_summary.scanned_at)
                    : '',
                  high: 0,
                  medium: 0,
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

  private postComplianceNIST(
    config: ComplianceNISTConfig
  ): Observable<ComplianceNISTMap> {
    return this.risksHttpService.postComplianceNIST(config);
  }

  private getCompliance(): Observable<ComplianceData> {
    return this.risksHttpService.getCompliance().pipe(
      map(complianceData => {
        complianceData.compliances.forEach(compliance => {
          let domains = new Set();
          compliance.nodes = compliance.nodes.map(nodeId => {
            complianceData.nodes[nodeId][0].id = nodeId;
            complianceData.nodes[nodeId][0].domains?.forEach(domain => {
              domains.add(domain);
            });
            return complianceData.nodes[nodeId][0];
          });
          compliance.workloads = compliance.workloads.map(workloadId => {
            complianceData.workloads[workloadId][0].id = workloadId;
            complianceData.workloads[workloadId][0].domains?.forEach(domain => {
              domains.add(domain);
            });
            return complianceData.workloads[workloadId][0];
          });
          compliance.platforms = compliance.platforms.map(platformId => {
            complianceData.platforms[platformId][0].id = platformId;
            complianceData.platforms[platformId][0].domains?.forEach(domain => {
              domains.add(domain);
            });
            return complianceData.platforms[platformId][0];
          });
          compliance.images = compliance.images.map(imageId => {
            complianceData.images[imageId][0].id = imageId;
            complianceData.images[imageId][0].domains?.forEach(domain => {
              domains.add(domain);
            });
            return complianceData.images[imageId][0];
          });
          compliance.domains = [...domains];
          compliance.images.sort(sortByDisplayName);
          compliance.workloads.sort(sortByDisplayName);
          compliance.nodes.sort(sortByDisplayName);
          compliance.platforms.sort(sortByDisplayName);
        });
        return complianceData;
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({
            compliances: [],
            nodes: {},
            platforms: {},
            images: {},
            workloads: {},
          } as any);
        } else {
          throw err;
        }
      })
    );
  }
}
