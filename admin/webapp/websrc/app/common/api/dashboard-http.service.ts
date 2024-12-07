import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import {
  SystemAlertSummary,
  InternalSystemInfo,
  Metrics,
  Score,
  PredictedScoreInfo,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';

@Injectable()
export class DashboardHttpService {
  patchScores(metrics: { metrics: Metrics }): Observable<PredictedScoreInfo> {
    return GlobalVariable.http.post<PredictedScoreInfo>(
      PathConstant.DASHBOARD_SCORES_URL,
      metrics
    );
  }

  getScores(
    isGlobalUser: boolean,
    domain: any
  ): Observable<InternalSystemInfo> {
    return GlobalVariable.http.get<InternalSystemInfo>(
      PathConstant.DASHBOARD_SCORES_URL,
      {
        params: {
          isGlobalUser,
          domain,
        },
      }
    );
  }

  getSystemAlerts() {
    return GlobalVariable.http.get<SystemAlertSummary>(
      PathConstant.SYSTEM_ALETS_URL
    );
  }

  getDashboardSecurityEventData(domain?: string) {
    const options = {};

    if (domain) {
      options['params'] = { domain: domain };
    }

    return GlobalVariable.http.get(
      PathConstant.DASHBOARD_NOTIFICATIONS_URL,
      options
    );
  }

  getDashboardDetailsData(domain?: string) {
    const options = {};

    if (domain) {
      options['params'] = { domain: domain };
    }

    return GlobalVariable.http.get(PathConstant.DASHBOARD_DETAILS_URL, options);
  }

  getSummaryData(domain?: string) {
    const options = {};

    if (domain) {
      options['params'] = { domain: domain };
    }

    return GlobalVariable.http.get(PathConstant.DASHBOARD_SUMMARY_URL, options);
  }
}
