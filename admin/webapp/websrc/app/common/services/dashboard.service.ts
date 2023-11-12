import { Injectable } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { AuthService } from '@services/auth.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { DashboardHttpService } from '@common/api/dashboard-http.service';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { HierarchicalExposure } from '@common/types';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly $win;
  private refreshEventSubject$ = new BehaviorSubject<boolean | undefined>(
    undefined
  );
  refreshEvent$ = this.refreshEventSubject$.asObservable();
  hierarchicalIngressList: Array<HierarchicalExposure>;
  hierarchicalEgressList: Array<HierarchicalExposure>;

  constructor(
    private authService: AuthService,
    private assetsHttpService: AssetsHttpService,
    private dashboardHttpService: DashboardHttpService
  ) {}

  isGoodScore = (score: number) => {
    return score <= GlobalConstant.SCORE_LEVEL.GOOD;
  };

  getScoreData = (
    isGlobalUser: boolean,
    domain: string | null
  ) => {
    return this.dashboardHttpService
      .getScores(isGlobalUser, domain)
      .pipe();
  };

  getDashboardSecurityEvent = (domain: string) => {
    return this.dashboardHttpService.getDashboardSecurityEventData(domain).pipe();
  };

  getDashboardDetails = (domain: string) => {
    return this.dashboardHttpService.getDashboardDetailsData(domain).pipe();
  };

  getSummaryInfo = (domain: string) => {
    return this.dashboardHttpService.getSummaryData(domain).pipe();
  };

  getRbacData = () => {
    return this.dashboardHttpService.getSystemRBAC().pipe();
  };

  getIpGeoInfo = (ipList: Array<string>) => {
    return GlobalVariable.http.patch(PathConstant.IP_GEO_URL, ipList).pipe();
  };

  getBasicData = (isGlobalUser: boolean) => {
    if (!GlobalVariable.hasInitializedSummary) {
      console.warn('Summary uninitialized');
    }

    const rbacPromise = this.getRbacData();
    const scorePromise = this.getScoreData(
      isGlobalUser,
      null
    );
    return forkJoin([rbacPromise, scorePromise]).pipe();
  };

  getDomainReportData = (
    isGlobalUser: boolean,
    domain: string
  ) => {
    const scorePromise = this.getScoreData(
      isGlobalUser,
      domain
    );
    const dashboardSecurityEventPromise = this.getDashboardSecurityEvent(domain);
    const dashboardDetailsPromise = this.getDashboardDetails(domain);
    const dashboardSummaryPromise = this.getSummaryInfo(domain)
    return forkJoin([
      scorePromise,
      dashboardSecurityEventPromise,
      dashboardDetailsPromise,
      dashboardSummaryPromise
    ]).pipe();
  };

  setAutoScan = (isAutoScan: boolean) => {
    return this.assetsHttpService.postScanConfig({ auto_scan: isAutoScan });
  };

  refresh() {
    this.refreshEventSubject$.next(true);
  }
}
