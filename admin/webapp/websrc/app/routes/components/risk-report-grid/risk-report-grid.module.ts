import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskReportGridComponent } from './risk-report-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AgGridModule } from 'ag-grid-angular';
import { RiskReportGridFilterService } from './risk-report-grid.filter.service';
import { RiskReportGridNameCellComponent } from './risk-report-grid-name-cell/risk-report-grid-name-cell.component';
import { RiskReportGridLevelCellComponent } from './risk-report-grid-level-cell/risk-report-grid-level-cell.component';
import { RiskReportGridLocationCellComponent } from './risk-report-grid-location-cell/risk-report-grid-location-cell.component';
import { RiskReportGridMessageCellComponent } from './risk-report-grid-message-cell/risk-report-grid-message-cell.component';
import { RiskReportGridFilterComponent } from './risk-report-grid-filter/risk-report-grid-filter.component';
import { RiskReportGridCsvService } from './csv-generation/risk-report-grid-csv.service';

@NgModule({
  declarations: [
    RiskReportGridComponent,
    RiskReportGridNameCellComponent,
    RiskReportGridLevelCellComponent,
    RiskReportGridLocationCellComponent,
    RiskReportGridMessageCellComponent,
    RiskReportGridFilterComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    DragDropModule,
    AgGridModule,
    // AgGridModule.withComponents([]),
  ],
  providers: [RiskReportGridFilterService, RiskReportGridCsvService],
  exports: [RiskReportGridComponent],
})
export class RiskReportGridModule {}
