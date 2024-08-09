import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { SecurityRiskPanelModule } from '@components/security-risk-panel/security-risk-panel.module';
import { ExposurePanelModule } from '@components/exposure-panel/exposure-panel.module';
import { SecurityEventsPanelModule } from '@components/security-events-panel/security-events-panel.module';
import { TopSecurityEventsPanelModule } from '@components/top-security-events-panel/top-security-events-panel.module';
import { TopVulnerableAssetsPanelModule } from '@components/top-vulnerable-assets-panel/top-vulnerable-assets-panel.module';
import { PolicyModePanelModule } from '@components/policy-mode-panel/policy-mode-panel.module';
import { ApplicationProtocolsPanelModule } from '@components/application-protocols-panel/application-protocols-panel.module';
import { DashboardExposureConversationsService } from './thread-services/dashboard-exposure-conversations.service';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { DashboardPrintableReportComponent } from './dashboard-printable-report/dashboard-printable-report.component';
import { ReportByNamespaceModalComponent } from './report-by-namespace-modal/report-by-namespace-modal.component';
import { ExposedServicePodGridModule } from '@components/exposed-service-pod-grid/exposed-service-pod-grid.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DashboardBasicDataResolver } from '@common/resolvers/dashboard-basic-data.resolver';
import { DashboardSecurityEventsResolver } from '@common/resolvers/dashboard-security-events.resolver';

const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent ,
    resolve: {
      basicData: DashboardBasicDataResolver,
      securityEvents: DashboardSecurityEventsResolver
    }
  }
];

@NgModule({
  declarations: [
    DashboardComponent,
    DashboardPrintableReportComponent,
    ReportByNamespaceModalComponent
  ],
  providers: [
    DashboardExposureConversationsService
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    SecurityRiskPanelModule,
    ExposurePanelModule,
    SecurityEventsPanelModule,
    TopSecurityEventsPanelModule,
    TopVulnerableAssetsPanelModule,
    PolicyModePanelModule,
    ApplicationProtocolsPanelModule,
    LoadingButtonModule,
    DragDropModule,
    ExposedServicePodGridModule,
    RouterModule.forChild(routes),
  ]
})
export class DashboardModule { }
