import { Injectable } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { AuthService } from '@services/auth.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { DashboardHttpService } from '@common/api/dashboard-http.service';
import { AssetsHttpService } from '@common/api/assets-http.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly $win;
  private refreshEventSubject$ = new BehaviorSubject<boolean | undefined>(
    undefined
  );
  refreshEvent$ = this.refreshEventSubject$.asObservable();

  constructor(
    private authService: AuthService,
    private assetsHttpService: AssetsHttpService,
    private dashboardHttpService: DashboardHttpService
  ) {}

  isGoodScore = (score: number) => {
    return score <= GlobalConstant.SCORE_LEVEL.GOOD;
  };

  getScoreData = (isGlobalUser: boolean, podCnt: number, domain: any) => {
    return this.dashboardHttpService
      .getScores(isGlobalUser, podCnt, domain)
      .pipe();
  };

  getRbacData = () => {
    return this.dashboardHttpService.getSystemRBAC().pipe();
  };

  getBasicData = (isGlobalUser: boolean) => {
    if (!GlobalVariable.hasInitializedSummary) {
      console.warn('Summary uninitialized');
    }

    const rbacPromise = this.getRbacData();
    const scorePromise = this.getScoreData(
      isGlobalUser,
      GlobalVariable.summary.running_pods,
      null
    );
    return forkJoin([rbacPromise, scorePromise]).pipe();
  };

  setAutoScan = (isAutoScan: boolean) => {
    return this.assetsHttpService.postScanConfig({ auto_scan: isAutoScan });
  };

  refresh() {
    this.refreshEventSubject$.next(true);
  }
}
