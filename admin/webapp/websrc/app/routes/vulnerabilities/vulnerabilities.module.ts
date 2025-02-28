import { NgModule } from '@angular/core';
import { VulnerabilitiesComponent } from './vulnerabilities.component';
import { VulnerabilityChartsComponent } from './vulnerability-charts/vulnerability-charts.component';
import { VulnerabilityItemsComponent } from './vulnerability-items/vulnerability-items.component';
import { VulnerabilityItemsTableComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table.component';
import { VulnerabilityItemsChartsComponent } from './vulnerability-items/vulnerability-items-charts/vulnerability-items-charts.component';
import { VulnerabilityItemsDetailsComponent } from './vulnerability-items/vulnerability-items-details/vulnerability-items-details.component';
import { VulnerabilityItemsTableFilterComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-filter/vulnerability-items-table-filter.component';
import { VulnerabilityItemsTableActionCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-action-cell/vulnerability-items-table-action-cell.component';
import { VulnerabilityItemsTableImpactCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-impact-cell/vulnerability-items-table-impact-cell.component';
import { VulnerabilityItemsTableScoreCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-score-cell/vulnerability-items-table-score-cell.component';
import { VulnerabilityItemsTableSevertiyCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-severtiy-cell/vulnerability-items-table-severtiy-cell.component';
import { RouterModule, Routes } from '@angular/router';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { ObserveModule } from '@common/directives/observe/observe.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { AgGridAngular } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { NgChartsModule } from 'ng2-charts';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { RisksViewReportModule } from '@components/security-risk-printable-report/risks-view-report/risks-view-report.module';
import { AssetsViewReportModule } from '@components/security-risk-printable-report/assets-view-report/assets-view-report.module';
import { NvCommonModule } from '@common/nvCommon.module';
import { PdfGenerationDialogComponent } from './pdf-generation-dialog/pdf-generation-dialog.component';
import { VulnerabilitiesGridModule } from '@components/vulnerabilities-grid/vulnerabilities-grid.module';
import { RiskAssetsLegendModule } from '@components/ui/risk-assets-legend/risk-assets-legend.module';
import { AgGridNoRowOverlayModule } from '@components/ui/ag-grid-no-row-overlay/ag-grid-no-row-overlay.module';
const routes: Routes = [{ path: '', component: VulnerabilitiesComponent }];

@NgModule({
  declarations: [
    VulnerabilitiesComponent,
    VulnerabilityChartsComponent,
    VulnerabilityItemsComponent,
    VulnerabilityItemsTableComponent,
    VulnerabilityItemsChartsComponent,
    VulnerabilityItemsDetailsComponent,
    VulnerabilityItemsTableFilterComponent,
    VulnerabilityItemsTableActionCellComponent,
    VulnerabilityItemsTableImpactCellComponent,
    VulnerabilityItemsTableScoreCellComponent,
    VulnerabilityItemsTableSevertiyCellComponent,
    PdfGenerationDialogComponent,
  ],
  providers: [
    VulnerabilitiesService,
    AssetsHttpService,
    AssetsViewPdfService,
    VulnerabilitiesCsvService,
    RisksHttpService,
    VulnerabilitiesFilterService,
  ],
  imports: [
    RouterModule.forChild(routes),
    NvCommonModule,
    NgChartsModule,
    LoadingTemplateModule,
    ObserveModule,
    DragDropModule,
    LoadingButtonModule,
    NgxSliderModule,
    AgGridAngular,
    QuickFilterModule,
    RisksViewReportModule,
    AssetsViewReportModule,
    VulnerabilitiesGridModule,
    RiskAssetsLegendModule,
    AgGridNoRowOverlayModule,
  ],
})
export class VulnerabilitiesModule {}
