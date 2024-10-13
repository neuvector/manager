import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApikeysGridComponent } from './apikeys-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { AgGridAngular } from 'ag-grid-angular';
import { ApikeysGridStateCellComponent } from './apikeys-grid-state-cell/apikeys-grid-state-cell.component';
import { ApikeysGridExpirationCellComponent } from './apikeys-grid-expiration-cell/apikeys-grid-expiration-cell.component';
import { ApikeysGridActionCellComponent } from './apikeys-grid-action-cell/apikeys-grid-action-cell.component';
import { AddApikeyDialogComponent } from './add-apikey-dialog/add-apikey-dialog.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { GroupDomainRoleModule } from '@routes/settings/common/group-domain-role/group-domain-role.module';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';

@NgModule({
  declarations: [
    ApikeysGridComponent,
    ApikeysGridStateCellComponent,
    ApikeysGridExpirationCellComponent,
    ApikeysGridActionCellComponent,
    AddApikeyDialogComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    // AgGridModule.withComponents([
    //   ApikeysGridStateCellComponent,
    //   ApikeysGridExpirationCellComponent,
    //   ApikeysGridActionCellComponent,
    // ]),
    LoadingButtonModule,
    GroupDomainRoleModule,
    ClipboardModule,
  ],
  exports: [ApikeysGridComponent],
})
export class ApikeysGridModule {}
