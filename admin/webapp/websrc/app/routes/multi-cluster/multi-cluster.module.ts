import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { MultiClusterComponent } from './multi-cluster.component';
import { TranslateModule } from '@ngx-translate/core';
import { JoiningModalComponent } from './joining-modal/joining-modal.component';
import { PromotionModalComponent } from './promotion-modal/promotion-modal.component';
import { TokenModalComponent } from './token-modal/token-modal.component';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { MultiClusterGridModule } from '@components/multi-cluster-grid/multi-cluster-grid.module';
import { SettingsService } from '@services/settings.service';
import { MultiClusterDetailsComponent } from './multi-cluster-details/multi-cluster-details.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';

const routes: Routes = [{ path: '', component: MultiClusterComponent }];

@NgModule({
  declarations: [
    MultiClusterComponent,
    JoiningModalComponent,
    PromotionModalComponent,
    TokenModalComponent,
    MultiClusterDetailsComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    TranslateModule,
    NvCommonModule,
    AdjustableDivModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    MultiClusterGridModule,
    ClipboardModule,
  ],
  exports: [MultiClusterComponent],
  providers: [SettingsService],
})
export class MultiClusterModule {}
