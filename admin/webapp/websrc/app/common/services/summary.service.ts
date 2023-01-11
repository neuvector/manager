import { Injectable } from '@angular/core';
import { CommonHttpService } from '@common/api/common-http.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { SystemSummary } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SummaryService {
  constructor(private commonHttpService: CommonHttpService) {}

  getSummary(): Observable<SystemSummary> {
    return this.commonHttpService.getSummary().pipe(
      tap({
        next: summaryInfo => {
          GlobalVariable.isOpenShift =
            summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
            summaryInfo.summary.platform === GlobalConstant.RANCHER;
          GlobalVariable.summary = summaryInfo.summary;
          GlobalVariable.hasInitializedSummary = true;
        },
      })
    );
  }

  refreshSummary(): void {
    this.getSummary().subscribe({ next: summaryInfo => {} });
  }
}
