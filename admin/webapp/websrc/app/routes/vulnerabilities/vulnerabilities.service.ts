import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RisksHttpService } from '@common/api/risks-http.service';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import {
  Compliance,
  HostData,
  VulnerabilityProfile,
  VulnerabilityAssetRaw,
  Workload,
  CfgType,
  VulnerabilitiesQuerySummary,
  VulnerabilitiesQueryData,
} from '@common/types';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { GridApi, SortModelItem } from 'ag-grid-community';

@Injectable()
export class VulnerabilitiesService {
  activeToken!: string;
  activeCount!: number;
  sortModel: SortModelItem[];
  activeSummary!: VulnerabilitiesQuerySummary;
  status: string;
  private activeSummarySubject$ = new Subject<void>();
  activeSummary$ = this.activeSummarySubject$.asObservable();
  vulnerabilitiesData$ = this.vulnerabilitiesFilterService.vulQuery$.pipe(
    switchMap(vulQuery =>
      this.risksHttpService.postVulnerabilityQuery(vulQuery).pipe(
        catchError(err => {
          if (
            [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
              err.status
            )
          ) {
            let emptyQuery: VulnerabilitiesQueryData = {
              query_token: '',
              total_matched_records: 0,
              total_records: 0,
              status: '',
              summary: {
                count_distribution: {
                  high: 0,
                  medium: 0,
                  low: 0,
                  container: 0,
                  image: 0,
                  node: 0,
                  platform: 0,
                },
                top_images: [],
                top_nodes: [],
              },
            };
            return of(emptyQuery);
          } else {
            throw err;
          }
        })
      )
    ),
    tap(queryData => {
      this.activeToken = queryData.query_token;
      this.activeSummary = queryData.summary;
      this.status = queryData.status;
      this.activeSummarySubject$.next();
      this.vulnerabilitiesFilterService.filteredCount =
        queryData.total_matched_records;
      this.activeCount = queryData.total_records;
      this.vulnerabilitiesFilterService.activePage = 0;
    })
  );
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
  private countDistributionSubject$ = new Subject<void>();
  countDistribution$ = this.countDistributionSubject$.asObservable();
  workloadMap4Pdf!: {};
  imageMap4Pdf!: {};
  platformMap4Pdf!: {};
  hostMap4Pdf!: {};
  refreshing$ = new Subject();
  private selectedVulnerabilitySubject$ = new BehaviorSubject<any>(undefined);
  selectedVulnerability$ = this.selectedVulnerabilitySubject$.asObservable();

  private cfgTypeSubject$ = new BehaviorSubject<CfgType>('');
  cfgType$ = this.cfgTypeSubject$.asObservable();
  setCfgType(cfgType: CfgType): void {
    this.cfgTypeSubject$.next(cfgType);
  }

  constructor(
    private datePipe: DatePipe,
    private risksHttpService: RisksHttpService,
    private vulnerabilitiesFilterService: VulnerabilitiesFilterService,
    private assetsHttpService: AssetsHttpService
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

  getVulnerabilitiesPage(
    start: number,
    sortModel: SortModelItem[],
    filterModel: any
  ) {
    let params: any = {
      token: this.activeToken,
      start: start,
      row: this.vulnerabilitiesFilterService.paginationBlockSize,
    };
    if (sortModel && sortModel.length) {
      this.sortModel = sortModel;
      params = {
        ...params,
        orderbyColumn: sortModel[0].colId,
        orderby: sortModel[0].sort,
      };
    } else {
      this.sortModel = [];
    }
    if (filterModel && '-' in filterModel) {
      params = {
        ...params,
        qf: filterModel['-'].filter,
        scoretype:
          this.vulnerabilitiesFilterService.selectedScore.toLowerCase(),
      };
    }
    return this.risksHttpService.getVulnerabilitiesQuery(params);
  }

  refresh() {
    this.refreshing$.next(true);
    this.vulnerabilitiesFilterService.vulQuerySubject$.next(
      this.vulnerabilitiesFilterService.vulQuerySubject$.value
    );
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

  acceptVulnerability(profile: VulnerabilityProfile) {
    return this.risksHttpService.postCVEProfile(profile);
  }

  getProfileType(): Observable<CfgType> {
    return this.risksHttpService.getCVEProfile().pipe(
      map(profile => {
        return profile.profiles[0]?.cfg_type || '';
      })
    );
  }

  getVulnerabilitiesViewReportData(lastModifiedTime: number): Observable<any> {
    let params: any = {
      token: this.activeToken,
      start: 0,
      row: -1,
      lastmtime: lastModifiedTime,
    };
    if (this.sortModel.length) {
      params = {
        ...params,
        orderbyColumn: this.sortModel[0].colId,
        orderby: this.sortModel[0].sort,
      };
    }
    return this.risksHttpService.getVulnerabilitiesQuery(params).pipe(
      map(sessionData => {
        return {
          data: sessionData.vulnerabilities,
          totalRecords: this.vulnerabilitiesFilterService.filteredCount,
        };
      })
    );
  }

  getAssetsViewReportData(
    queryToken: string,
    lastModifiedTime: number
  ): Observable<any> {
    return this.risksHttpService
      .postAssetsViewData(queryToken, lastModifiedTime)
      .pipe();
  }

  getDomain(): Observable<string[]> {
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

  extractPodImage(vulnerabilities) {
    return vulnerabilities.map(vulnerability => {
      let imageMap = new Map();
      vulnerability.workloads?.forEach(workload => {
        imageMap.set(workload.image, {
          display_name: workload.image,
          policy_mode: workload.policy_mode,
        });
      });
      if (vulnerability.images) {
        vulnerability.images.push(...Array.from(imageMap.values()));
      } else {
        vulnerability.images = Array.from(imageMap.values());
      }
      return vulnerability;
    });
  }
}
