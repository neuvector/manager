import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { TopSecurityEventsPanelComponent } from './top-security-events-panel.component';
import { TopSecurityEventsChartComponent } from './partial/top-security-events-chart/top-security-events-chart.component';
import { EmptyDataChartReplacementModule } from '@components/ui/empty-data-chart-replacement/empty-data-chart-replacement.module';
import { NgChartsModule } from 'ng2-charts';
import { PanelInstructionCurtainModule } from '@components/ui/panel-instruction-curtain/panel-instruction-curtain.module';



@NgModule({
  declarations: [
    TopSecurityEventsPanelComponent,
    TopSecurityEventsChartComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    EmptyDataChartReplacementModule,
    PanelInstructionCurtainModule
  ],
  exports: [
    TopSecurityEventsPanelComponent,
    TopSecurityEventsChartComponent
  ]
})
export class TopSecurityEventsPanelModule { }
