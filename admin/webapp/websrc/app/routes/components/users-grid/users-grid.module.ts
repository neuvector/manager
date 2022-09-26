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

@NgModule({
  declarations: [
    UsersGridComponent,
    UsersGridUsernameCellComponent,
    UsersGridActionCellComponent,
    AddEditUserDialogComponent,
  ],
  imports: [
    CommonModule,
    QuickFilterModule,
    NvCommonModule,
    LoadingButtonModule,
    PasswordPanelModule,
    GroupDomainRoleModule,
    AgGridModule.withComponents([
      UsersGridActionCellComponent,
      UsersGridUsernameCellComponent,
    ]),
  ],
  exports: [UsersGridComponent],
})
export class UsersGridModule {}
