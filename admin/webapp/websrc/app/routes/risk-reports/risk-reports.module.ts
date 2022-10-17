import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskReportsComponent } from './risk-reports.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { RiskReportGridModule } from '@components/risk-report-grid/risk-report-grid.module';
import { RiskReportsPrintableReportComponent } from './risk-reports-printable-report/risk-reports-printable-report.component';
import { NgChartsModule } from 'ng2-charts';
import { RiskReportsPrintableReportBarChartComponent } from './risk-reports-printable-report/risk-reports-printable-report-bar-chart/risk-reports-printable-report-bar-chart.component';
import { RiskReportsPrintableReportPieChartComponent } from './risk-reports-printable-report/risk-reports-printable-report-pie-chart/risk-reports-printable-report-pie-chart.component';

const routes: Routes = [{ path: '', component: RiskReportsComponent }];

@NgModule({
  declarations: [
    RiskReportsComponent,
    RiskReportsPrintableReportComponent,
    RiskReportsPrintableReportBarChartComponent,
    RiskReportsPrintableReportPieChartComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    RouterModule.forChild(routes),
    LoadingButtonModule,
    LoadingTemplateModule,
    RiskReportGridModule,
  ],
})
export class RiskReportsModule {}
