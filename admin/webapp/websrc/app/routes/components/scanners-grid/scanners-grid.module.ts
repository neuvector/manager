import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannersGridComponent } from './scanners-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  declarations: [ScannersGridComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    AgGridModule,
    // AgGridModule.withComponents([]),
  ],
  exports: [ScannersGridComponent],
})
export class ScannersGridModule {}
