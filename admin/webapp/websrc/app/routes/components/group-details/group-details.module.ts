import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { GroupDetailsComponent } from './group-details.component';
import { MembersComponent } from './partial/members/members.component';
import { CustomCheckComponent } from './partial/custom-check/custom-check.component';
import { GroupDlpComponent } from './partial/group-dlp/group-dlp.component';
import { GroupWafComponent } from './partial/group-waf/group-waf.component';
import { ResponseRulesModule } from '@components/response-rules/response-rules.module';
import { NetworkRulesModule } from '@components/network-rules/network-rules.module';
import { ProcessProfileRulesModule } from '@components/process-profile-rules/process-profile-rules.module';
import { FileAccessRulesModule } from '@components/file-access-rules/file-access-rules.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { CustomCheckActionButtonComponent } from './partial/custom-check-action-button/custom-check-action-button.component';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { GroupDlpConfigModalComponent } from './partial/group-dlp-config-modal/group-dlp-config-modal.component';
import { GroupDlpConfigActionButtonComponent } from './partial/group-dlp-config-action-button/group-dlp-config-action-button.component';
import { GroupWafConfigModalComponent } from './partial/group-waf-config-modal/group-waf-config-modal.component';
import { GroupWafConfigActionButtonComponent } from './partial/group-waf-config-action-button/group-waf-config-action-button.component';
import { ContainersGridModule } from '@components/containers-grid/containers-grid.module';
import { NodesGridModule } from '@components/nodes-grid/nodes-grid.module';

@NgModule({
  declarations: [
    GroupDetailsComponent,
    MembersComponent,
    CustomCheckComponent,
    GroupDlpComponent,
    GroupWafComponent,
    CustomCheckActionButtonComponent,
    GroupDlpConfigModalComponent,
    GroupDlpConfigActionButtonComponent,
    GroupWafConfigModalComponent,
    GroupWafConfigActionButtonComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    ResponseRulesModule,
    NetworkRulesModule,
    ProcessProfileRulesModule,
    FileAccessRulesModule,
    LoadingButtonModule,
    QuickFilterModule,
    ContainersGridModule,
    NodesGridModule,
    AgGridModule,
    // AgGridModule.withComponents([
    //   CustomCheckActionButtonComponent,
    //   GroupDlpConfigActionButtonComponent
    // ]),
  ],
  exports: [
    MembersComponent,
    GroupDetailsComponent,
    GroupDlpComponent,
    GroupWafComponent,
  ],
})
export class GroupDetailsModule {}
