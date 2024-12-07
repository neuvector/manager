import { Injectable } from '@angular/core';
import { DashboardHttpService } from '@common/api/dashboard-http.service';
import {
  HierarchicalExposure,
  InternalSystemInfo,
  Metrics,
} from '@common/types';
import { parseExposureHierarchicalData } from '@common/utils/common.utils';
import { BehaviorSubject } from 'rxjs';

export type ScoreImprovementModalTemplate =
  | 'general'
  | 'service-risk'
  | 'exposure'
  | 'run-as-privileged'
  | 'run-as-root'
  | 'admission-control'
  | 'completed';

@Injectable()
export class ScoreImprovementModalService {
  private templateSubject$ = new BehaviorSubject<ScoreImprovementModalTemplate>(
    'general'
  );
  template$ = this.templateSubject$.asObservable();
  scoreInfo!: InternalSystemInfo;
  get score() {
    return this.scoreInfo.security_scores.security_risk_score;
  }

  constructor(private dashboardHttpService: DashboardHttpService) {}

  reset() {
    this.templateSubject$.next('general');
  }

  go(template: ScoreImprovementModalTemplate) {
    this.templateSubject$.next(template);
  }

  newMetrics() {
    return Object.assign({}, this.scoreInfo.metrics);
  }

  getScores(isGlobalUser: boolean, domain: any) {
    return this.dashboardHttpService.getScores(isGlobalUser, domain);
  }

  calculateScoreData(metrics: Metrics) {
    return this.dashboardHttpService.patchScores({ metrics: metrics });
  }

  prepareExposureData(): {
    ingress: HierarchicalExposure[];
    egress: HierarchicalExposure[];
  } {
    let ingress = parseExposureHierarchicalData(this.scoreInfo.ingress);
    let egress = parseExposureHierarchicalData(this.scoreInfo.egress);
    return {
      ingress,
      egress,
    };
  }
}
