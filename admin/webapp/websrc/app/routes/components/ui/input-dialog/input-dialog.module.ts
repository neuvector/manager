import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputDialogComponent } from './input-dialog.component';
import { NvCommonModule } from '@common/nvCommon.module';

@NgModule({
  declarations: [InputDialogComponent],
  imports: [CommonModule, NvCommonModule],
  exports: [InputDialogComponent],
})
export class InputDialogModule {}
