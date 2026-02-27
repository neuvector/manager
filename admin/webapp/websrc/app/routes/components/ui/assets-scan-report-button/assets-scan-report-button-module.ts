import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { AssetsScanReportButton } from './assets-scan-report-button';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { AdvancedFilter } from './partial/advanced-filter/advanced-filter';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

@NgModule({
  declarations: [AssetsScanReportButton, AdvancedFilter],
  imports: [
    CommonModule,
    MatButtonModule,
    TranslateModule,
    NvCommonModule,
    NgxSliderModule,
  ],
  exports: [AssetsScanReportButton],
})
export class AssetsScanReportButtonModule {}
