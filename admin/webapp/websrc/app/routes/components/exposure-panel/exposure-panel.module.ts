import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ExposurePanelComponent } from './exposure-panel.component';
import { ExposureChartComponent } from './partial/exposure-chart/exposure-chart.component';
import { NgChartsModule } from 'ng2-charts';
import { ExposureGridModule } from '@components/exposure-grid/exposure-grid.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { EmptyDataChartReplacementModule } from '@components/ui/empty-data-chart-replacement/empty-data-chart-replacement.module';

@NgModule({
  declarations: [
    ExposurePanelComponent,
    ExposureChartComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    ExposureGridModule,
    LoadingButtonModule,
    EmptyDataChartReplacementModule
  ],
  exports: [
    ExposurePanelComponent,
    ExposureChartComponent
  ],
})
export class ExposurePanelModule {}
