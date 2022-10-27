import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VulnerabilitiesComponent } from './vulnerabilities.component';
import { VulnerabilityChartsComponent } from './vulnerability-charts/vulnerability-charts.component';
import { VulnerabilityItemsComponent } from './vulnerability-items/vulnerability-items.component';
import { VulnerabilityItemsTableComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table.component';
import { VulnerabilityItemsChartsComponent } from './vulnerability-items/vulnerability-items-charts/vulnerability-items-charts.component';
import { VulnerabilityItemsDetailsComponent } from './vulnerability-items/vulnerability-items-details/vulnerability-items-details.component';
import { VulnerabilityItemsTableFilterComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-filter/vulnerability-items-table-filter.component';
import { VulnerabilityItemsTableCsvCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-csv-cell/vulnerability-items-table-csv-cell.component';
import { VulnerabilityItemsTableImpactCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-impact-cell/vulnerability-items-table-impact-cell.component';
import { VulnerabilityItemsTableScoreCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-score-cell/vulnerability-items-table-score-cell.component';
import { VulnerabilityItemsTableSevertiyCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-severtiy-cell/vulnerability-items-table-severtiy-cell.component';
import { VulnerabilityItemsTableNameCellComponent } from './vulnerability-items/vulnerability-items-table/vulnerability-items-table-name-cell/vulnerability-items-table-name-cell.component';
import { RouterModule, Routes } from '@angular/router';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { ObserveModule } from '@common/directives/observe/observe.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { MatCardModule } from '@angular/material/card';
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { MatMenuModule } from '@angular/material/menu';
import { NgChartsModule } from 'ng2-charts';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { i18nPdfTranslateService } from './pdf-generation/i18n-pdf-transalte.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { VulnerabilityViewPdfService } from './pdf-generation/vulnerability-view-pdf.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatRadioModule } from '@angular/material/radio';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RisksViewReportModule } from '@components/security-risk-printable-report/risks-view-report/risks-view-report.module';
import { AssetsViewReportModule } from '@components/security-risk-printable-report/assets-view-report/assets-view-report.module';

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
    VulnerabilityItemsTableCsvCellComponent,
    VulnerabilityItemsTableImpactCellComponent,
    VulnerabilityItemsTableScoreCellComponent,
    VulnerabilityItemsTableSevertiyCellComponent,
    VulnerabilityItemsTableNameCellComponent
  ],
  providers: [
    VulnerabilitiesService,
    AssetsHttpService,
    AssetsViewPdfService,
    VulnerabilityViewPdfService,
    VulnerabilitiesCsvService,
    RisksHttpService,
    VulnerabilitiesFilterService,
    i18nPdfTranslateService,
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatMenuModule,
    NgChartsModule,
    LoadingTemplateModule,
    ObserveModule,
    MatDialogModule,
    MatFormFieldModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    DragDropModule,
    MatRadioModule,
    MatOptionModule,
    LoadingButtonModule,
    TranslateModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    NgxSliderModule,
    AgGridModule,
    QuickFilterModule,
    MatButtonModule,
    RisksViewReportModule,
    AssetsViewReportModule,
  ],
})
export class VulnerabilitiesModule {}
