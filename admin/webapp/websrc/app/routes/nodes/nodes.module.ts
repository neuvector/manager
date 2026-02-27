import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodesComponent } from './nodes.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { NodesGridModule } from '@components/nodes-grid/nodes-grid.module';
import { NodeDetailsComponent } from './node-details/node-details.component';
import { NodeDetailComponent } from './node-details/node-detail/node-detail.component';
import { PipeModule } from '@common/pipes/pipe.module';
import { ComplianceGridModule } from '@components/compliance-grid/compliance-grid.module';
import { VulnerabilitiesGridModule } from '@components/vulnerabilities-grid/vulnerabilities-grid.module';
import { ContainersGridModule } from '@components/containers-grid/containers-grid.module';
import { AssetsScanReportButtonModule } from '@components/ui/assets-scan-report-button/assets-scan-report-button-module';

const routes: Routes = [{ path: '', component: NodesComponent }];

@NgModule({
  declarations: [NodesComponent, NodeDetailsComponent, NodeDetailComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    PipeModule,
    RouterModule.forChild(routes),
    AdjustableDivModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    NodesGridModule,
    ComplianceGridModule,
    VulnerabilitiesGridModule,
    ContainersGridModule,
    AssetsScanReportButtonModule,
  ],
})
export class NodesModule {}
