import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VulnerabilitiesGridComponent } from './vulnerabilities-grid.component';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { VulnerabilitiesGridSeverityCellComponent } from './vulnerabilities-grid-severity-cell/vulnerabilities-grid-severity-cell.component';
import { VulnerabilityDetailDialogComponent } from './vulnerability-detail-dialog/vulnerability-detail-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    VulnerabilitiesGridComponent,
    VulnerabilitiesGridSeverityCellComponent,
    VulnerabilityDetailDialogComponent,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    AgGridModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    QuickFilterModule,
  ],
  exports: [VulnerabilitiesGridComponent, VulnerabilityDetailDialogComponent],
})
export class VulnerabilitiesGridModule {}
