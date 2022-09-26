import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { GroupsComponent } from './groups.component';
import { ActionButtonsComponent } from './partial/action-buttons/action-buttons.component';
import { ExportGroupPolicyComponent } from './partial/export-group-policy/export-group-policy.component';
import { PolicyModeCellComponent } from './partial/policy-mode-cell/policy-mode-cell.component';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AddEditGroupModalComponent } from './partial/add-edit-group-modal/add-edit-group-modal.component';
import { ConfirmDialogModule } from '@components/ui/confirm-dialog/confirm-dialog.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { ScorableHeaderComponent } from './partial/scorable-header/scorable-header.component';
import { SwitchModeModalComponent } from './partial/switch-mode-modal/switch-mode-modal.component';
import { PipeModule } from '@common/pipes/pipe.module';
import { ServiceModeService } from '@services/service-mode.service';

@NgModule({
  declarations: [
    GroupsComponent,
    ActionButtonsComponent,
    ExportGroupPolicyComponent,
    PolicyModeCellComponent,
    AddEditGroupModalComponent,
    ScorableHeaderComponent,
    SwitchModeModalComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    ConfirmDialogModule,
    LoadingButtonModule,
    PipeModule,
    AgGridModule.withComponents([ActionButtonsComponent]),
  ],
  providers: [ServiceModeService],
  exports: [GroupsComponent],
})
export class GroupsModule {}
