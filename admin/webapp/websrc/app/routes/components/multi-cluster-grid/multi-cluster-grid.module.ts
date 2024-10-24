import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridModule } from 'ag-grid-angular';

import { MultiClusterGridComponent } from './multi-cluster-grid.component';
import { MultiClusterGridActionCellComponent } from './multi-cluster-grid-action-cell/multi-cluster-grid-action-cell.component';

@NgModule({
  declarations: [
    MultiClusterGridComponent,
    MultiClusterGridActionCellComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    AgGridModule,
    // AgGridModule.withComponents([])
  ],
  exports: [MultiClusterGridComponent],
})
export class MultiClusterGridModule {}
