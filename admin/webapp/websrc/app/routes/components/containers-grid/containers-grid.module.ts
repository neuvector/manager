import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainersGridComponent } from './containers-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridAngular } from 'ag-grid-angular';
import { ContainersGridNameCellComponent } from './containers-grid-name-cell/containers-grid-name-cell.component';
import { ContainersGridStateCellComponent } from './containers-grid-state-cell/containers-grid-state-cell.component';
import { ContainersGridStatusCellComponent } from './containers-grid-status-cell/containers-grid-status-cell.component';

@NgModule({
  declarations: [ContainersGridComponent, ContainersGridNameCellComponent, ContainersGridStateCellComponent, ContainersGridStatusCellComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    // AgGridModule.withComponents([]),
  ],
  exports: [ContainersGridComponent],
})
export class ContainersGridModule {}
