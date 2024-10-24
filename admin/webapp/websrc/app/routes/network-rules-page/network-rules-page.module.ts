import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NetworkRulesPageComponent } from './network-rules-page.component';
import { NetworkRulesModule } from '@components/network-rules/network-rules.module';

const routes: Routes = [
  { path: '', component: NetworkRulesPageComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [NetworkRulesPageComponent],
  imports: [CommonModule, NetworkRulesModule, RouterModule.forChild(routes)],
})
export class NetworkRulesPageModule {}
