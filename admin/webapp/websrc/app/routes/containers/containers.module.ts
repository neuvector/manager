import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainersComponent } from './containers.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { RouterModule, Routes } from '@angular/router';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { ContainersGridModule } from '@components/containers-grid/containers-grid.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { ContainerDetailsComponent } from './container-details/container-details.component';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { ComplianceGridModule } from '@components/compliance-grid/compliance-grid.module';
import { VulnerabilitiesGridModule } from '@components/vulnerabilities-grid/vulnerabilities-grid.module';
import { ProcessGridModule } from '@components/process-grid/process-grid.module';
import { ContainerStatsModule } from '@components/container-stats/container-stats.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ContainerDetailModule } from '@components/container-detail/container-detail.module';
import { ContainersPrintableReportComponent } from './containers-printable-report/containers-printable-report.component';
import { ContainersPrintableReportChartComponent } from './containers-printable-report/containers-printable-report-chart/containers-printable-report-chart.component';
import { NgChartsModule } from 'ng2-charts';
import { AssetsScanReportButtonModule } from '@components/ui/assets-scan-report-button/assets-scan-report-button-module';

const routes: Routes = [{ path: '', component: ContainersComponent }];

@NgModule({
  declarations: [
    ContainersComponent,
    ContainerDetailsComponent,
    ContainersPrintableReportComponent,
    ContainersPrintableReportChartComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    AdjustableDivModule,
    DragDropModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    ContainersGridModule,
    ContainerDetailModule,
    ContainerStatsModule,
    ComplianceGridModule,
    VulnerabilitiesGridModule,
    ProcessGridModule,
    QuickFilterModule,
    NgChartsModule,
    AssetsScanReportButtonModule,
  ],
})
export class ContainersModule {}
