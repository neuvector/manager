import { NgModule } from '@angular/core';
import { ExportOptionsModalComponent } from '@components/export-options-modal/export-options-modal.component';
import { ExportOptionsModule } from '@components/export-options/export-options.module';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';

@NgModule({
  imports: [
    CommonModule,
    NvCommonModule,
    LoadingButtonModule,
    ExportOptionsModule,
  ],
  declarations: [ExportOptionsModalComponent],
  exports: [ExportOptionsModalComponent],
})
export class ExportOptionsModalModule {}
