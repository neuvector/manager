import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RisksHttpService } from '@common/api/risks-http.service';
import { AssetsHttpService } from '@common/api/assets-http.service';
import {
  catchError,
  finalize,
  map,
  repeatWhen,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  Compliance,
  HostData,
  HostsData,
  VulnerabilityProfile,
  VulnerabilityAssetRaw,
  Workload,
  WorkloadsData,
  CfgType,
  VulnerabilitiesQueryData,
  VulnerabilitiesQuerySummary,
  OrderByOption,
  VulQueryOrderByColumnOption,
} from '@common/types';
import { PlatformsData } from '@common/types/compliance/platformsData';
import { setRisks, sortByDisplayName } from '@common/utils/common.utils';
import { VulnerabilitiesData } from '@common/types';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { MapConstant } from '@common/constants/map.constant';
import { GridApi } from 'ag-grid-community';

@Injectable()
export class VulnerabilitiesService {
  activeToken!: string;
  activeCount!: number;
  activeSummary!: VulnerabilitiesQuerySummary;
  private activeSummarySubject$ = new Subject();
  activeSummary$ = this.activeSummarySubject$.asObservable();
  vulnerabilitiesData$ = this.vulnerabilitiesFilterService.vulQuery$.pipe(
    switchMap(vulQuery =>
      this.risksHttpService.postVulnerabilityQuery(vulQuery)
    ),
    tap(queryData => {
      this.activeToken = queryData.query_token;
      this.activeSummary = queryData.summary;
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
  private countDistributionSubject$ = new Subject();
  countDistribution$ = this.countDistributionSubject$.asObservable();
  workloadMap4Pdf!: {};
  private workloadMap!: Map<string, any>;
  imageMap4Pdf!: {};
  platformMap4Pdf!: {};
  hostMap4Pdf!: {};
  private refreshSubject$ = new Subject();
  refreshing$ = new Subject();
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

  getVulnerabilitiesPage(
    start: number,
    orderby?: OrderByOption,
    orderbyColumn?: VulQueryOrderByColumnOption
  ) {
    if (orderby && orderbyColumn) {
      return this.risksHttpService.getVulnerabilitiesQuery({
        token: this.activeToken,
        start: start,
        row: this.vulnerabilitiesFilterService.paginationBlockSize,
        orderbyColumn: orderbyColumn,
        orderby: orderby,
      });
    } else {
      return this.risksHttpService.getVulnerabilitiesQuery({
        token: this.activeToken,
        start: start,
        row: this.vulnerabilitiesFilterService.paginationBlockSize,
      });
    }
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
        return profile.profiles[0].cfg_type || '';
      })
    );
  }


  getAssetsViewReportData(queryToken: string, lastModifiedTime: number): Observable<any> {
    return this.risksHttpService.postAssetsViewData(queryToken, lastModifiedTime).pipe();
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
}
