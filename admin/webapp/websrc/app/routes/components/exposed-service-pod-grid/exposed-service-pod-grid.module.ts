import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExposedServicePodGridComponent } from './exposed-service-pod-grid.component';
import { ExposedServicePodGridServiceCellComponent } from './exposed-service-pod-grid-service-cell/exposed-service-pod-grid-service-cell.component';
import { AgGridModule } from 'ag-grid-angular';
import { ExposedServicePodGridActionCellComponent } from './exposed-service-pod-grid-action-cell/exposed-service-pod-grid-action-cell.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExposureServicePodReportGridComponent } from './exposure-service-pod-report-grid/exposure-service-pod-report-grid.component';

@NgModule({
  declarations: [
    ExposedServicePodGridComponent,
    ExposedServicePodGridServiceCellComponent,
    ExposedServicePodGridActionCellComponent,
    ExposureServicePodReportGridComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    AgGridModule,
    // AgGridModule.withComponents([ExposedServicePodGridServiceCellComponent]),
  ],
  exports: [
    ExposedServicePodGridComponent,
    ExposureServicePodReportGridComponent,
  ],
})
export class ExposedServicePodGridModule {}
