import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { Routes, RouterModule } from '@angular/router';
import { SecurityEventsComponent } from './security-events.component';
import { ThreatDetailsComponent } from './partial/threat-details/threat-details.component';
import { ViolationDetailsComponent } from './partial/violation-details/violation-details.component';
import { IncidentDetailsComponent } from './partial/incident-details/incident-details.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SecurityEventChartComponent } from './partial/security-event-chart/security-event-chart.component';
import { NgChartsModule } from 'ng2-charts';
import { DateSliderComponent } from './partial/date-slider/date-slider.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { AdvancedFilterModalComponent } from './partial/advanced-filter-modal/advanced-filter-modal.component';
import { AdvancedFilterModalService } from './partial/advanced-filter-modal/advanced-filter-modal.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PacketModalComponent } from './partial/packet-modal/packet-modal.component';
import { NodeBriefModule } from '@components/node-brief/node-brief.module';
import { EnforcerBriefModule } from '@components/enforcer-brief/enforcer-brief.module';
import { ReviewProcessRuleModalComponent } from './partial/review-process-rule-modal/review-process-rule-modal.component';
import { ReviewNetworkRuleModalComponent } from './partial/review-network-rule-modal/review-network-rule-modal.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { PodBriefModule } from  '@components/pod-brief/pod-brief.module';
import { SecurityEventsPrintableReportComponent } from './partial/security-events-printable-report/security-events-printable-report.component';
import { SecurityEventsPrintableReportLocationColComponent } from './partial/security-events-printable-report-location-col/security-events-printable-report-location-col.component';
import { SecurityEventsPrintableReportDetailsColComponent } from './partial/security-events-printable-report-details-col/security-events-printable-report-details-col.component';
import { SecurityEventsPrintableReportActionColComponent } from './partial/security-events-printable-report-action-col/security-events-printable-report-action-col.component';
import { SecurityEventsPrintableReportSeverityColComponent } from './partial/security-events-printable-report-severity-col/security-events-printable-report-severity-col.component';
import { SecurityEventsPrintableReportChartComponent } from './partial/security-events-printable-report-chart/security-events-printable-report-chart.component';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';

const routes: Routes = [
  { path: '', component: SecurityEventsComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [
    SecurityEventsComponent,
    ThreatDetailsComponent,
    ViolationDetailsComponent,
    IncidentDetailsComponent,
    SecurityEventChartComponent,
    DateSliderComponent,
    AdvancedFilterModalComponent,
    PacketModalComponent,
    ReviewProcessRuleModalComponent,
    ReviewNetworkRuleModalComponent,
    SecurityEventsPrintableReportComponent,
    SecurityEventsPrintableReportLocationColComponent,
    SecurityEventsPrintableReportDetailsColComponent,
    SecurityEventsPrintableReportActionColComponent,
    SecurityEventsPrintableReportSeverityColComponent,
    SecurityEventsPrintableReportChartComponent,
  ],
  providers: [
    AdvancedFilterModalService
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    ScrollingModule,
    NgChartsModule,
    NgxSliderModule,
    DragDropModule,
    NodeBriefModule,
    LoadingButtonModule,
    PodBriefModule,
    EnforcerBriefModule,
    LoadingTemplateModule
  ]
})
export class SecurityEventsModule { }
