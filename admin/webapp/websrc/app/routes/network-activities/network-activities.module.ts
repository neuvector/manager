import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NetworkActivitiesComponent } from './network-activities.component';
import { GraphService } from '@routes/network-activities/graph.service';
import { NvCommonModule } from '@common/nvCommon.module';
import { LegendComponent } from './legend/legend.component';
import { ActiveSessionComponent } from './active-session/active-session.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { EdgeDetailsComponent } from './edge-details/edge-details.component';
import { SnifferComponent } from "./sniffer/sniffer.component";
import { SniffService } from "@routes/network-activities/sniffer/sniff.service";
import { NgxSliderModule } from "@angular-slider/ngx-slider";
import { NamespaceInfoComponent } from './namespace-info/namespace-info.component';
import { GroupInfoComponent } from './group-info/group-info.component';
import { HostInfoComponent } from './host-info/host-info.component';
import { PodInfoComponent } from './pod-info/pod-info.component';
import { PipeModule } from "@common/pipes/pipe.module";
import { NodeBriefModule } from "@components/node-brief/node-brief.module";
import { GroupDetailsModule } from "@components/group-details/group-details.module";
import { NetworkRulesModule } from "@components/network-rules/network-rules.module";
import { ResponseRulesModule } from '@components/response-rules/response-rules.module';
import { BlacklistComponent } from './blacklist/blacklist.component';
import { AdvancedFilterComponent } from './advanced-filter/advanced-filter.component';
import {
    VulnerabilitiesGridModule
} from "@components/vulnerabilities-grid/vulnerabilities-grid.module";
import { ClientIpCellComponent } from './client-ip-cell/client-ip-cell.component';
import { ServerIpCellComponent } from './server-ip-cell/server-ip-cell.component';

const routes: Routes = [
  { path: '', component: NetworkActivitiesComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [
    NetworkActivitiesComponent,
    LegendComponent,
    ActiveSessionComponent,
    EdgeDetailsComponent,
    SnifferComponent,
    NamespaceInfoComponent,
    GroupInfoComponent,
    HostInfoComponent,
    PodInfoComponent,
    BlacklistComponent,
    AdvancedFilterComponent,
    ClientIpCellComponent,
    ServerIpCellComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    DragDropModule,
    AgGridModule,
    NgxSliderModule,
    QuickFilterModule,
    PipeModule,
    NodeBriefModule,
    GroupDetailsModule,
    NetworkRulesModule,
    ResponseRulesModule,
    VulnerabilitiesGridModule,
  ],
  providers: [GraphService, SniffService],
})
export class NetworkActivitiesModule {}
