import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceGridComponent } from './compliance-grid.component';
import { AgGridAngular } from 'ag-grid-angular';
import { MatButtonModule } from '@angular/material/button';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { ComplianceGridCategoryCellComponent } from './compliance-grid-category-cell/compliance-grid-category-cell.component';
import { ComplianceGridStatusCellComponent } from './compliance-grid-status-cell/compliance-grid-status-cell.component';
import { ComplianceGridNameCellComponent } from './compliance-grid-name-cell/compliance-grid-name-cell.component';
import { RemediationDetailDialogComponent } from './remediation-detail-dialog/remediation-detail-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    ComplianceGridComponent,
    ComplianceGridCategoryCellComponent,
    ComplianceGridStatusCellComponent,
    ComplianceGridNameCellComponent,
    RemediationDetailDialogComponent,
  ],
  imports: [
    CommonModule,
    AgGridAngular,
    DragDropModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    QuickFilterModule,
    TranslateModule,
  ],
  exports: [ComplianceGridComponent, RemediationDetailDialogComponent],
})
export class ComplianceGridModule {}
