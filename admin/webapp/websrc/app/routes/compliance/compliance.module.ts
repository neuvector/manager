import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ComplianceComponent } from './compliance.component';
import { ComplianceChartsComponent } from './compliance-charts/compliance-charts.component';
import { ComplianceItemsComponent } from './compliance-items/compliance-items.component';
import { ComplianceItemsTableComponent } from './compliance-items/compliance-items-table/compliance-items-table.component';
import { ComplianceItemDetailsComponent } from './compliance-items/compliance-item-details/compliance-item-details.component';
import { RouterModule, Routes } from '@angular/router';
import { ComplianceService } from './compliance.service';
import { AgGridModule } from 'ag-grid-angular';
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
import { ComplianceViewPdfService } from './pdf-generation/compliance-view-pdf.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { i18nPdfTranslateService } from './pdf-generation/i18n-pdf-translate.service';
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
  ],
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    RouterModule.forChild(routes),
    TranslateModule,
    AgGridModule,
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
    NodeBriefModule,
    ContainerBriefModule,
    MatMenuModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  providers: [
    ComplianceService,
    ComplianceViewPdfService,
    AssetsViewPdfService,
    i18nPdfTranslateService,
    ComplianceFilterService,
    ComplianceCsvService,
    AssetsHttpService,
    RisksHttpService,
    DatePipe,
  ],
  exports: [ComplianceItemsTableComponent],
})
export class ComplianceModule {}
