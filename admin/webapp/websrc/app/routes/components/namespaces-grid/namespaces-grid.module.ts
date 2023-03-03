import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NamespacesGridComponent } from './namespaces-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  declarations: [NamespacesGridComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    AgGridModule.withComponents([]),
  ],
  exports: [NamespacesGridComponent],
})
export class NamespacesGridModule {}
