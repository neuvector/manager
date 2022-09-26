import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { TopVulnerableAssetsPanelComponent } from './top-vulnerable-assets-panel.component';
import { NgChartsModule } from 'ng2-charts';
import { TopVulnerableAssetsChartComponent } from './partial/top-vulnerable-assets-chart/top-vulnerable-assets-chart.component';




@NgModule({
  declarations: [
    TopVulnerableAssetsPanelComponent,
    TopVulnerableAssetsChartComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule
  ],
  exports: [
    TopVulnerableAssetsPanelComponent
  ]
})
export class TopVulnerableAssetsPanelModule { }
