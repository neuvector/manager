import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersGridComponent } from './users-grid.component';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AgGridModule } from 'ag-grid-angular';
import { UsersGridUsernameCellComponent } from './users-grid-username-cell/users-grid-username-cell.component';
import { UsersGridActionCellComponent } from './users-grid-action-cell/users-grid-action-cell.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AddEditUserDialogComponent } from './add-edit-user-dialog/add-edit-user-dialog.component';
import { PasswordPanelModule } from 'app/routes/settings/common/password-panel/password-panel.module';
import { GroupDomainRoleModule } from 'app/routes/settings/common/group-domain-role/group-domain-role.module';
import { UsersGridUserCellComponent } from './users-grid-user-cell/users-grid-user-cell.component';
import { AvatarModule } from 'ngx-avatars';
import { RancherPermissionsGridComponent } from './rancher-permissions-grid/rancher-permissions-grid.component';
import { RolesGridModule } from '@routes/components/roles-grid/roles-grid.module';

@NgModule({
  declarations: [
    UsersGridComponent,
    UsersGridUsernameCellComponent,
    UsersGridActionCellComponent,
    AddEditUserDialogComponent,
    UsersGridUserCellComponent,
    RancherPermissionsGridComponent,
  ],
  imports: [
    CommonModule,
    QuickFilterModule,
    NvCommonModule,
    AvatarModule,
    LoadingButtonModule,
    PasswordPanelModule,
    GroupDomainRoleModule,
    RolesGridModule,
    AgGridModule,
    // AgGridModule.withComponents([
    //   UsersGridActionCellComponent,
    //   UsersGridUsernameCellComponent,
    // ]),
  ],
  exports: [UsersGridComponent],
})
export class UsersGridModule {}
