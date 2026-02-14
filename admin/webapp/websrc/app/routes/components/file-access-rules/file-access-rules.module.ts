import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { FileAccessRulesComponent } from './file-access-rules.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AddEditFileAccessRuleModalComponent } from './partial/add-edit-file-access-rule-modal/add-edit-file-access-rule-modal.component';
import { PredefinedFileAccessRulesModalComponent } from './partial/predefined-file-access-rules-modal/predefined-file-access-rules-modal.component';
import { OperationCellComponent } from './partial/predefined-file-access-rules-modal/operation-cell/operation-cell/operation-cell.component';

@NgModule({
  declarations: [
    FileAccessRulesComponent,
    AddEditFileAccessRuleModalComponent,
    PredefinedFileAccessRulesModalComponent,
    OperationCellComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    AgGridModule,
    // AgGridModule.withComponents([]),
  ],
  exports: [FileAccessRulesComponent],
})
export class FileAccessRulesModule {}
