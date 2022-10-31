import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { PolicyModePanelComponent } from './policy-mode-panel.component';
import { NgChartsModule } from 'ng2-charts';
import { PolicyModeChartComponent } from './partial/policy-mode-chart/policy-mode-chart.component';
import { PolicyModeCautionComponent } from './partial/policy-mode-caution/policy-mode-caution.component';
import { EmptyDataChartReplacementModule } from '@components/ui/empty-data-chart-replacement/empty-data-chart-replacement.module';



@NgModule({
  declarations: [
    PolicyModePanelComponent,
    PolicyModeChartComponent,
    PolicyModeCautionComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    EmptyDataChartReplacementModule
  ],
  exports: [
    PolicyModePanelComponent,
    PolicyModeChartComponent,
    PolicyModeCautionComponent
  ]
})
export class PolicyModePanelModule { }
