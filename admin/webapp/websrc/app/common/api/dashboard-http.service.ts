import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { InternalSystemInfo, Metrics, Score } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';

@Injectable()
export class DashboardHttpService {
  patchScores(
    metrics: Metrics,
    isGlobalUser: boolean,
    totalRunningPods: number
  ): Observable<Score> {
    return GlobalVariable.http.patch<Score>(
      PathConstant.DASHBOARD_SCORES_URL,
      metrics,
      { params: { isGlobalUser, totalRunningPods } }
    );
  }

  getScores(
    isGlobalUser: boolean,
    totalRunningPods: number,
    domain: any
  ): Observable<InternalSystemInfo> {
    return GlobalVariable.http.get<InternalSystemInfo>(
      PathConstant.DASHBOARD_SCORES_URL,
      {
        params: {
          isGlobalUser,
          totalRunningPods,
          domain,
        },
      }
    );
  }

  getSystemRBAC() {
    return GlobalVariable.http.get(PathConstant.SYSTEM_RBAC_URL);
  }
}
