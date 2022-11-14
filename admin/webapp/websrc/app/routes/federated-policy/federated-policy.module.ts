import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FederatedPolicyComponent } from './federated-policy.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { ProcessProfileRulesModule } from '@components/process-profile-rules/process-profile-rules.module';
import { FileAccessRulesModule } from '@components/file-access-rules/file-access-rules.module';
import { FederatedPolicyConfigurationModule } from '@components/federated-policy-configuration/federated-policy-configuration.module';
import { ResponseRulesModule } from '@components/response-rules/response-rules.module';
import { AdmissionRulesModule } from '@components/admission-rules/admission-rules.module';
import { NetworkRulesModule } from '@components/network-rules/network-rules.module';
import { GroupsModule } from '@components/groups/groups.module';

const routes: Routes = [
  { path: '', component: FederatedPolicyComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [FederatedPolicyComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    ProcessProfileRulesModule,
    FileAccessRulesModule,
    FederatedPolicyConfigurationModule,
    ResponseRulesModule,
    AdmissionRulesModule,
    NetworkRulesModule,
    GroupsModule,
    RouterModule.forChild(routes),
  ]
})
export class FederatedPolicyModule {}
