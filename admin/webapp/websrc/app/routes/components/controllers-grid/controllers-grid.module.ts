import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControllersGridComponent } from './controllers-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AgGridModule } from 'ag-grid-angular';
import { ControllersGridStatusCellComponent } from './controllers-grid-status-cell/controllers-grid-status-cell.component';

@NgModule({
  declarations: [ControllersGridComponent, ControllersGridStatusCellComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    AgGridModule
    // AgGridModule.withComponents([]),
  ],
  exports: [ControllersGridComponent],
})
export class ControllersGridModule {}
