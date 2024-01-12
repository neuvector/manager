import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ComplianceProfileComponent } from './compliance-profile.component';
import { RouterModule, Routes } from '@angular/router';
import { ComplianceProfileTemplatesComponent } from './compliance-profile-templates/compliance-profile-templates.component';
import { ComplianceProfileAssetsComponent } from './compliance-profile-assets/compliance-profile-assets.component';
import { ComplianceProfileAssetsTableComponent } from './compliance-profile-assets/compliance-profile-assets-table/compliance-profile-assets-table.component';
import { ComplianceProfileTemplatesTableComponent } from './compliance-profile-templates/compliance-profile-templates-table/compliance-profile-templates-table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AgGridModule } from 'ag-grid-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { ComplianceProfileService } from '@routes/compliance-profile/compliance-profile.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { ObserveModule } from '@common/directives/observe/observe.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { RegulationsCellComponent } from './compliance-profile-templates/compliance-profile-templates-table/regulations-cell/regulations-cell.component';
import { CategoriesCellComponent } from './compliance-profile-templates/compliance-profile-templates-table/categories-cell/categories-cell.component';
import { ActionCellComponent } from './compliance-profile-templates/compliance-profile-templates-table/action-cell/action-cell.component';
import { FormsModule } from '@angular/forms';
import { EditTemplateDialogComponent } from './compliance-profile-assets/compliance-profile-assets-table/edit-template-dialog/edit-template-dialog.component';
import { EditRegulationDialogComponent } from './compliance-profile-templates/compliance-profile-templates-table/edit-regulation-dialog/edit-regulation-dialog.component';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { TemplatesCellComponent } from './compliance-profile-assets/compliance-profile-assets-table/templates-cell/templates-cell.component';
import { ExportOptionsModalModule } from '@components/export-options-modal/export-options-modal.module';

const routes: Routes = [{ path: '', component: ComplianceProfileComponent }];

@NgModule({
  declarations: [
    ComplianceProfileComponent,
    ComplianceProfileTemplatesComponent,
    ComplianceProfileAssetsComponent,
    ComplianceProfileAssetsTableComponent,
    ComplianceProfileTemplatesTableComponent,
    RegulationsCellComponent,
    CategoriesCellComponent,
    ActionCellComponent,
    EditTemplateDialogComponent,
    EditRegulationDialogComponent,
    TemplatesCellComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    AgGridModule,
    TranslateModule,
    MatDialogModule,
    QuickFilterModule,
    MatTabsModule,
    MatCardModule,
    ObserveModule,
    LoadingTemplateModule,
    ExportOptionsModalModule,
  ],
  providers: [ComplianceProfileService, RisksHttpService, AssetsHttpService],
})
export class ComplianceProfileModule {}
