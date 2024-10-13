import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesGridComponent } from './roles-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridAngular } from 'ag-grid-angular';
import { RolesGridPermissionsCellComponent } from './roles-grid-permissions-cell/roles-grid-permissions-cell.component';
import { RolesGridActionCellComponent } from './roles-grid-action-cell/roles-grid-action-cell.component';
import { AddEditRoleDialogComponent } from './add-edit-role-dialog/add-edit-role-dialog.component';
import { PermissionCheckboxComponent } from './add-edit-role-dialog/permission-checkbox/permission-checkbox.component';
import { PermissionService } from './add-edit-role-dialog/permission.service';

@NgModule({
  declarations: [
    RolesGridComponent,
    RolesGridPermissionsCellComponent,
    RolesGridActionCellComponent,
    AddEditRoleDialogComponent,
    PermissionCheckboxComponent,
  ],
  imports: [
    CommonModule,
    QuickFilterModule,
    NvCommonModule,
    LoadingButtonModule,
    // AgGridModule.withComponents([
    //   RolesGridActionCellComponent,
    //   RolesGridPermissionsCellComponent,
    // ]),
  ],
  providers: [PermissionService],
  exports: [RolesGridComponent, RolesGridPermissionsCellComponent],
})
export class RolesGridModule {}
