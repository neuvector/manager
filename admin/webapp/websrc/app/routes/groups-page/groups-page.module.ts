import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { Routes, RouterModule } from '@angular/router';
import { GroupsPageComponent } from './groups-page.component';
import { GroupsModule } from '@components/groups/groups.module';
import { GroupDetailsModule } from '@components/group-details/group-details.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { ImportFileModalModule } from '@components/ui/import-file-modal/import-file-modal.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';

const routes: Routes = [
  { path: '', component: GroupsPageComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [GroupsPageComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    LoadingButtonModule,
    GroupsModule,
    GroupDetailsModule,
    AdjustableDivModule,
    ImportFileModalModule,
    RouterModule.forChild(routes),
  ],
})
export class GroupsPageModule {}
