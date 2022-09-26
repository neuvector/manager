import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ApplicationProtocolsPanelComponent } from './application-protocols-panel.component';
import { NgChartsModule } from 'ng2-charts';
import { ApplicationConversationChartComponent } from './partial/application-conversation-chart/application-conversation-chart.component';
import { ApplicationVolumeChartComponent } from './partial/application-volume-chart/application-volume-chart.component';



@NgModule({
  declarations: [
    ApplicationProtocolsPanelComponent,
    ApplicationConversationChartComponent,
    ApplicationVolumeChartComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule
  ],
  exports: [
    ApplicationProtocolsPanelComponent
  ]
})
export class ApplicationProtocolsPanelModule { }
