import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerStatsComponent } from './container-stats.component';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [ContainerStatsComponent],
  imports: [CommonModule, NgChartsModule],
  exports: [ContainerStatsComponent],
})
export class ContainerStatsModule {}
