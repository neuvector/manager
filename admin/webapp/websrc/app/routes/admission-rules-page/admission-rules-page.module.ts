import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AdmissionRulesPageComponent } from './admission-rules-page.component';
import { AdmissionRulesModule } from '@components/admission-rules/admission-rules.module';

const routes: Routes = [
  { path: '', component: AdmissionRulesPageComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [AdmissionRulesPageComponent],
  imports: [CommonModule, AdmissionRulesModule, RouterModule.forChild(routes)],
})
export class AdmissionRulesPageModule {}
