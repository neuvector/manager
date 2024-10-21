import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessGridComponent } from './process-grid.component';
import { AgGridAngular } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { ProcessGridActionCellComponent } from './process-grid-action-cell/process-grid-action-cell.component';

@NgModule({
  declarations: [ProcessGridComponent, ProcessGridActionCellComponent],
  imports: [CommonModule, AgGridAngular, QuickFilterModule],
  exports: [ProcessGridComponent],
})
export class ProcessGridModule {}
