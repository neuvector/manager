import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { RiskAssetsLegendComponent } from './risk-assets-legend.component';

@NgModule({
  declarations: [RiskAssetsLegendComponent],
  imports: [CommonModule, NvCommonModule],
  exports: [RiskAssetsLegendComponent],
})
export class RiskAssetsLegendModule {}
