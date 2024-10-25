import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { TopVulnerableAssetsPanelComponent } from './top-vulnerable-assets-panel.component';
import { NgChartsModule } from 'ng2-charts';
import { TopVulnerableAssetsChartComponent } from './partial/top-vulnerable-assets-chart/top-vulnerable-assets-chart.component';
import { EmptyDataChartReplacementModule } from '@components/ui/empty-data-chart-replacement/empty-data-chart-replacement.module';
import { PanelInstructionCurtainModule } from '@components/ui/panel-instruction-curtain/panel-instruction-curtain.module';
import { SecurityRiskPanelModule } from '@components/security-risk-panel/security-risk-panel.module';

@NgModule({
  declarations: [
    TopVulnerableAssetsPanelComponent,
    TopVulnerableAssetsChartComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    EmptyDataChartReplacementModule,
    PanelInstructionCurtainModule,
    SecurityRiskPanelModule,
  ],
  exports: [
    TopVulnerableAssetsPanelComponent,
    TopVulnerableAssetsChartComponent,
  ],
})
export class TopVulnerableAssetsPanelModule {}
