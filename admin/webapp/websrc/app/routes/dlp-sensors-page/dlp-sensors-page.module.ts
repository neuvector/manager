import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { DlpSensorsPageComponent } from './dlp-sensors-page.component';
import { DlpSensorsModule } from '@components/dlp-sensors/dlp-sensors.module';

const routes: Routes = [
  { path: '', component: DlpSensorsPageComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [DlpSensorsPageComponent],
  imports: [CommonModule, DlpSensorsModule, RouterModule.forChild(routes)],
})
export class DlpSensorsPageModule {}
