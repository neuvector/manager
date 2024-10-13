import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ComplianceComponent } from './compliance.component';
import { ComplianceChartsComponent } from './compliance-charts/compliance-charts.component';
import { ComplianceItemsComponent } from './compliance-items/compliance-items.component';
import { ComplianceItemsTableComponent } from './compliance-items/compliance-items-table/compliance-items-table.component';
import { ComplianceItemDetailsComponent } from './compliance-items/compliance-item-details/compliance-item-details.component';
import { RouterModule, Routes } from '@angular/router';
import { ComplianceService } from './compliance.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ObserveModule } from '@common/directives/observe/observe.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { TranslateModule } from '@ngx-translate/core';
import { ComplianceItemsTableImpactCellComponent } from './compliance-items/compliance-items-table/compliance-items-table-impact-cell/compliance-items-table-impact-cell.component';
import { ComplianceItemsTableCsvCellComponent } from './compliance-items/compliance-items-table/compliance-items-table-csv-cell/compliance-items-table-csv-cell.component';
import { ComplianceItemsTableStatusCellComponent } from './compliance-items/compliance-items-table/compliance-items-table-status-cell/compliance-items-table-status-cell.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { NgChartsModule } from 'ng2-charts';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { ComplianceFilterService } from './compliance.filter.service';
import { ComplianceCsvService } from './csv-generation/compliance-csv.service';
import { ComplianceItemsChartsComponent } from './compliance-items/compliance-items-charts/compliance-items-charts.component';
import { ComplianceItemsTableFilterComponent } from './compliance-items/compliance-items-table/compliance-items-table-filter/compliance-items-table-filter.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NodeBriefModule } from '@components/node-brief/node-brief.module';
import { ContainerBriefModule } from '@components/container-brief/container-brief.module';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { RisksViewReportModule } from '@components/security-risk-printable-report/risks-view-report/risks-view-report.module';
import { AssetsViewReportModule } from '@components/security-risk-printable-report/assets-view-report/assets-view-report.module';
import { RiskAssetsLegendModule } from '@components/ui/risk-assets-legend/risk-assets-legend.module';
import { ComplianceItemsDetailsComponent } from './compliance-items/compliance-items-details/compliance-items-details.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ComplianceRegulationGridModule } from '@components/compliance-regulation-grid/compliance-regulation-grid.module';

const routes: Routes = [{ path: '', component: ComplianceComponent }];

@NgModule({
  declarations: [
    ComplianceComponent,
    ComplianceChartsComponent,
    ComplianceItemsComponent,
    ComplianceItemsTableComponent,
    ComplianceItemDetailsComponent,
    ComplianceItemsTableImpactCellComponent,
    ComplianceItemsTableCsvCellComponent,
    ComplianceItemsTableStatusCellComponent,
    ComplianceItemsChartsComponent,
    ComplianceItemsTableFilterComponent,
    ComplianceItemsDetailsComponent,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    RouterModule.forChild(routes),
    TranslateModule,
    AgGridAngular,
    MatButtonModule,
    LoadingButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    NgChartsModule,
    LoadingButtonModule,
    QuickFilterModule,
    LoadingTemplateModule,
    ObserveModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatTabsModule,
    NodeBriefModule,
    ContainerBriefModule,
    ComplianceRegulationGridModule,
    MatMenuModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    ReactiveFormsModule,
    RisksViewReportModule,
    AssetsViewReportModule,
    RiskAssetsLegendModule,
  ],
  providers: [
    ComplianceService,
    AssetsViewPdfService,
    ComplianceFilterService,
    ComplianceCsvService,
    AssetsHttpService,
    RisksHttpService,
    DatePipe,
  ],
  exports: [ComplianceItemsTableComponent],
})
export class ComplianceModule {}
