import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformsGridComponent } from './platforms-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridModule } from 'ag-grid-angular';
import { PlatformsGridStatusCellComponent } from './platforms-grid-status-cell/platforms-grid-status-cell.component';

@NgModule({
  declarations: [PlatformsGridComponent, PlatformsGridStatusCellComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    AgGridModule,
    // AgGridModule.withComponents([]),
  ],
  exports: [PlatformsGridComponent],
})
export class PlatformsGridModule {}
