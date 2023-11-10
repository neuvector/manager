import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExposureGridComponent } from './exposure-grid.component';
import { ExposedServicePodGridModule } from '@components/exposed-service-pod-grid/exposed-service-pod-grid.module';
import { ExposedServicepodConvGridModule } from '@components/exposed-servicepod-conv-grid/exposed-servicepod-conv-grid.module';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [ExposureGridComponent],
  imports: [
    CommonModule,
    ExposedServicePodGridModule,
    ExposedServicepodConvGridModule,
    MatTabsModule,
    TranslateModule,
  ],
  exports: [ExposureGridComponent],
})
export class ExposureGridModule {}
