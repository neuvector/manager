import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NamespacesComponent } from './namespaces.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { NamespacesGridModule } from '@components/namespaces-grid/namespaces-grid.module';
import { NamespaceDetailsComponent } from './namespace-details/namespace-details.component';
import { DomainNameCellComponent } from './namespace-items/domain-name-cell/domain-name-cell.component';

const routes: Routes = [{ path: '', component: NamespacesComponent }];

@NgModule({
  declarations: [NamespacesComponent, NamespaceDetailsComponent, DomainNameCellComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    NamespacesGridModule,
    AdjustableDivModule,
    LoadingButtonModule,
    LoadingTemplateModule,
  ],
})
export class NamespacesModule {}
