import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ImportFileModalComponent } from './import-file-modal.component';
import { ImportFileModule } from '@components/ui/import-file/import-file.module';

@NgModule({
  declarations: [ImportFileModalComponent],
  imports: [CommonModule, NvCommonModule, ImportFileModule],
  exports: [ImportFileModalComponent],
})
export class ImportFileModalModule {}
