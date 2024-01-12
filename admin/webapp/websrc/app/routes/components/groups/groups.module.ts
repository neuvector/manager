import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { GroupsComponent } from './groups.component';
import { ActionButtonsComponent } from './partial/action-buttons/action-buttons.component';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AddEditGroupModalComponent } from './partial/add-edit-group-modal/add-edit-group-modal.component';
import { ConfirmDialogModule } from '@components/ui/confirm-dialog/confirm-dialog.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { ScorableHeaderComponent } from './partial/scorable-header/scorable-header.component';
import { GroupResponseRulesComponent } from '@components/groups/partial/group-response-rules/group-response-rules.component';
import { GroupNetworkRulesComponent } from '@components/groups/partial/group-network-rules/group-network-rules.component';
import { SwitchModeModalComponent } from './partial/switch-mode-modal/switch-mode-modal.component';
import { PipeModule } from '@common/pipes/pipe.module';
import { ServiceModeService } from '@services/service-mode.service';
import { RuleDetailModalComponent } from './partial/rule-detail-modal/rule-detail-modal.component';
import { RuleDetailModalService } from '@components/groups/partial/rule-detail-modal/rule-detail-modal.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ExportOptionsModalModule } from '@components/export-options-modal/export-options-modal.module';

@NgModule({
  declarations: [
    GroupsComponent,
    ActionButtonsComponent,
    AddEditGroupModalComponent,
    ScorableHeaderComponent,
    SwitchModeModalComponent,
    GroupResponseRulesComponent,
    GroupNetworkRulesComponent,
    RuleDetailModalComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    ConfirmDialogModule,
    LoadingButtonModule,
    PipeModule,
    DragDropModule,
    AgGridModule.withComponents([ActionButtonsComponent]),
    ExportOptionsModalModule,
  ],
  providers: [ServiceModeService, RuleDetailModalService],
  exports: [GroupsComponent],
})
export class GroupsModule {}
