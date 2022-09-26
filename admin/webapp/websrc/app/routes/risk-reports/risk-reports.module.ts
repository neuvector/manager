import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskReportsComponent } from './risk-reports.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { RiskReportGridModule } from '@components/risk-report-grid/risk-report-grid.module';

const routes: Routes = [{ path: '', component: RiskReportsComponent }];

@NgModule({
  declarations: [RiskReportsComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    LoadingButtonModule,
    LoadingTemplateModule,
    RiskReportGridModule,
  ],
})
export class RiskReportsModule {}
