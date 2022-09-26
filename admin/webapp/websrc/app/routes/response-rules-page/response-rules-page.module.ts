import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ResponseRulesPageComponent } from './response-rules-page.component';
import { ResponseRulesModule } from '@components/response-rules/response-rules.module';

const routes: Routes = [
  { path: '', component: ResponseRulesPageComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [
    ResponseRulesPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ResponseRulesModule,
  ]
})
export class ResponseRulesPageModule { }
