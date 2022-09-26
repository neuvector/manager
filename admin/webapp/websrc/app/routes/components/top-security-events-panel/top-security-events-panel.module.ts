import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { TopSecurityEventsPanelComponent } from './top-security-events-panel.component';
import { TopSecurityEventsChartComponent } from './partial/top-security-events-chart/top-security-events-chart.component';
import { TopSecurityEventsGridComponent } from './partial/top-security-events-grid/top-security-events-grid.component';
import { NgChartsModule } from 'ng2-charts';



@NgModule({
  declarations: [
    TopSecurityEventsPanelComponent,
    TopSecurityEventsChartComponent,
    TopSecurityEventsGridComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule
  ],
  exports: [
    TopSecurityEventsPanelComponent
  ]
})
export class TopSecurityEventsPanelModule { }
