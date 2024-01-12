import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ExportOptionsComponent } from './export-options.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [ExportOptionsComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  exports: [ExportOptionsComponent],
})
export class ExportOptionsModule {}
