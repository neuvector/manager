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
import { DashboardSecurityEventsService } from './thread-services/dashboard-security-events.service';
import { DashboardDetailsService } from './thread-services/dashboard-details.service';
import { DashboardExposureConversationsService } from './thread-services/dashboard-exposure-conversations.service';

const routes: Routes = [{ path: '', component: DashboardComponent }];

@NgModule({
  declarations: [
    DashboardComponent
  ],
  providers: [
    DashboardSecurityEventsService,
    DashboardDetailsService,
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
    RouterModule.forChild(routes),
  ]
})
export class DashboardModule { }
