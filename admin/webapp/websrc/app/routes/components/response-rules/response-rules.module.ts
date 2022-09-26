import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ResponseRulesComponent } from './response-rules.component';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { ActionButtonsComponent } from './partial/action-buttons/action-buttons.component';
import { AddEditResponseRuleModalComponent } from './partial/add-edit-response-rule-modal/add-edit-response-rule-modal.component';

@NgModule({
  declarations: [
    ResponseRulesComponent,
    ActionButtonsComponent,
    AddEditResponseRuleModalComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    AgGridModule.withComponents([
      ActionButtonsComponent,
      AddEditResponseRuleModalComponent,
    ]),
  ],
  entryComponents: [AddEditResponseRuleModalComponent],
  exports: [ResponseRulesComponent],
})
export class ResponseRulesModule {}
