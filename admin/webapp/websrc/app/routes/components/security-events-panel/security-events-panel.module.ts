import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { SecurityEventsPanelComponent } from './security-events-panel.component';
import { SecurityEventsChartComponent } from './partial/security-events-chart/security-events-chart.component';
import { EmptyDataChartReplacementModule } from '@components/ui/empty-data-chart-replacement/empty-data-chart-replacement.module';
import { NgChartsModule } from 'ng2-charts';
import { PanelInstructionCurtainModule } from '@components/ui/panel-instruction-curtain/panel-instruction-curtain.module';

@NgModule({
  declarations: [SecurityEventsPanelComponent, SecurityEventsChartComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    EmptyDataChartReplacementModule,
    PanelInstructionCurtainModule,
  ],
  exports: [SecurityEventsPanelComponent, SecurityEventsChartComponent],
})
export class SecurityEventsPanelModule {}
