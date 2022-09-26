import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { RegistriesComponent } from './registries.component';
import { RouterModule, Routes } from '@angular/router';
import { RegistriesTableComponent } from './registries-table/registries-table.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AgGridModule } from 'ag-grid-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatInputModule } from '@angular/material/input';
import { RegistriesService } from '@services/registries.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NeuVectorFormlyModule } from '@common/neuvector-formly/neuvector-formly.module';
import { AddRegistryDialogComponent } from './registries-table/add-registry-dialog/add-registry-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { RegistriesTableButtonsComponent } from './registries-table/registries-table-buttons/registries-table-buttons.component';
import { RegistryDetailsComponent } from './registry-details/registry-details.component';
import { MatTabsModule } from '@angular/material/tabs';
import { RegistryOverviewComponent } from './registry-details/registry-overview/registry-overview.component';
import { RegistryDetailsTableComponent } from './registry-details/registry-details-table/registry-details-table.component';
import { NgChartsModule } from 'ng2-charts';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RegistryDetailsVulnerabilitiesCellComponent } from './registry-details/registry-details-table/registry-details-vulnerabilities-cell/registry-details-vulnerabilities-cell.component';
import { TestSettingsDialogComponent } from './registries-table/add-registry-dialog/test-connection-dialog/test-settings-dialog.component';
import { RegistryDetailsDialogComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-details-dialog.component';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { ObserveModule } from '@common/directives/observe/observe.module';
import { ComplianceGridModule } from '@components/compliance-grid/compliance-grid.module';
import { RegistryModulesComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-modules/registry-modules.component';
import { RegistryVulnerabilitiesComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-vulnerabilities/registry-vulnerabilities.component';
import { LayersTableComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-vulnerabilities/layers-table/layers-table.component';
import { VulnerabilitiesGridModule } from '@components/vulnerabilities-grid/vulnerabilities-grid.module';
import { ModulesTableComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-modules/modules-table/modules-table.component';
import { VulnerabilitiesTableComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-modules/vulnerabilities-table/vulnerabilities-table.component';
import { ModulesChartsComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-modules/modules-charts/modules-charts.component';
import { StatusCellComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-modules/vulnerabilities-table/status-cell/status-cell.component';
import { ModuleVulnerabilitiesCellComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-modules/modules-table/module-vulnerabilities-cell/module-vulnerabilities-cell.component';
import { LayersTableCvesCellComponent } from './registry-details/registry-details-table/registry-details-dialog/registry-vulnerabilities/layers-table/layers-table-cves-cell/layers-table-cves-cell.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { RegistriesCommunicationService } from './regestries-communication.service';
import { RegistryDetailsTableStatusCellComponent } from './registry-details/registry-details-table/registry-details-table-status-cell/registry-details-table-status-cell.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RegistryTableStatusCellComponent } from './registries-table/registry-table-status-cell/registry-table-status-cell.component';
import { ConfirmDeleteDialogComponent } from './registries-table/confirm-delete-dialog/confirm-delete-dialog.component';
import { TestConnectionDialogDetailsCellComponent } from './registries-table/add-registry-dialog/test-connection-dialog/test-connection-dialog-details-cell/test-connection-dialog-details-cell.component';
import { TestConnectionDialogTypeCellComponent } from './registries-table/add-registry-dialog/test-connection-dialog/test-connection-dialog-type-cell/test-connection-dialog-type-cell.component';

const routes: Routes = [{ path: '', component: RegistriesComponent }];

@NgModule({
  declarations: [
    RegistriesComponent,
    RegistriesTableComponent,
    AddRegistryDialogComponent,
    RegistriesTableButtonsComponent,
    RegistryDetailsComponent,
    RegistryOverviewComponent,
    RegistryDetailsTableComponent,
    RegistryDetailsVulnerabilitiesCellComponent,
    TestSettingsDialogComponent,
    RegistryDetailsDialogComponent,
    RegistryModulesComponent,
    RegistryVulnerabilitiesComponent,
    LayersTableComponent,
    ModulesTableComponent,
    VulnerabilitiesTableComponent,
    ModulesChartsComponent,
    StatusCellComponent,
    ModuleVulnerabilitiesCellComponent,
    LayersTableCvesCellComponent,
    RegistryDetailsTableStatusCellComponent,
    RegistryTableStatusCellComponent,
    ConfirmDeleteDialogComponent,
    TestConnectionDialogDetailsCellComponent,
    TestConnectionDialogTypeCellComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NeuVectorFormlyModule,
    AgGridModule,
    TranslateModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgChartsModule,
    LoadingButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    AdjustableDivModule,
    LoadingTemplateModule,
    ComplianceGridModule,
    ObserveModule,
    MatMenuModule,
    MatTooltipModule,
    QuickFilterModule,
    VulnerabilitiesGridModule,
    NvCommonModule
  ],
  providers: [RegistriesService, RegistriesCommunicationService],
})
export class RegistriesModule {}
