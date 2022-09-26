import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ExposurePanelComponent } from './exposure-panel.component';
import { ExposureChartComponent } from './partial/exposure-chart/exposure-chart.component';
import { NgChartsModule } from 'ng2-charts';
import { ExposureGridModule } from '@components/exposure-grid/exposure-grid.module';

@NgModule({
  declarations: [ExposurePanelComponent, ExposureChartComponent],
  imports: [CommonModule, NvCommonModule, NgChartsModule, ExposureGridModule],
  exports: [ExposurePanelComponent],
})
export class ExposurePanelModule {}
