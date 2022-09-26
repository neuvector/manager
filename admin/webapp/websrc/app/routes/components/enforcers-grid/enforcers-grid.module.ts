import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnforcersGridComponent } from './enforcers-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AgGridModule } from 'ag-grid-angular';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { EnforcersGridStatusCellComponent } from './enforcers-grid-status-cell/enforcers-grid-status-cell.component';

@NgModule({
  declarations: [EnforcersGridComponent, EnforcersGridStatusCellComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    AgGridModule.withComponents([]),
  ],
  exports: [EnforcersGridComponent],
})
export class EnforcersGridModule {}
