import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { WafSensorsPageComponent } from './waf-sensors-page.component';
import { WafSensorsModule } from '@components/waf-sensors/waf-sensors.module';

const routes: Routes = [
  { path: '', component: WafSensorsPageComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [WafSensorsPageComponent],
  imports: [CommonModule, WafSensorsModule, RouterModule.forChild(routes)],
})
export class WafSensorsPageModule {}
