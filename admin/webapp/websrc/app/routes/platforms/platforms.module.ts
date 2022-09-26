import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformsComponent } from './platforms.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { PlatformsGridModule } from '@components/platforms-grid/platforms-grid.module';
import { PlatformDetailsComponent } from './platform-details/platform-details.component';
import { VulnerabilitiesGridModule } from '@components/vulnerabilities-grid/vulnerabilities-grid.module';

const routes: Routes = [{ path: '', component: PlatformsComponent }];

@NgModule({
  declarations: [PlatformsComponent, PlatformDetailsComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    LoadingTemplateModule,
    LoadingButtonModule,
    AdjustableDivModule,
    PlatformsGridModule,
    VulnerabilitiesGridModule,
  ],
})
export class PlatformsModule {}
