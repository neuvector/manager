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
    EnforcerBriefModule
  ]
})
export class SecurityEventsModule { }
