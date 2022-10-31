import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyDataChartReplacementComponent } from './empty-data-chart-replacement.component';
import { SafeNotificationComponent } from './safe-notification/safe-notification.component';
import { WarningNotificationComponent } from './warning-notification/warning-notification.component';



@NgModule({
  declarations: [
    EmptyDataChartReplacementComponent,
    SafeNotificationComponent,
    WarningNotificationComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    EmptyDataChartReplacementComponent
  ]
})
export class EmptyDataChartReplacementModule { }
