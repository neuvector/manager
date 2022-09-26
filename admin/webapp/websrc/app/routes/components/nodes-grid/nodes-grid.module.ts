import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodesGridComponent } from './nodes-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridModule } from 'ag-grid-angular';
import { NodesGridStatusCellComponent } from './nodes-grid-status-cell/nodes-grid-status-cell.component';

@NgModule({
  declarations: [NodesGridComponent, NodesGridStatusCellComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    AgGridModule.withComponents([]),
  ],
  exports: [NodesGridComponent],
})
export class NodesGridModule {}
