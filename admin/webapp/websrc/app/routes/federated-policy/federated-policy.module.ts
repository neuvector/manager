import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FederatedPolicyComponent } from './federated-policy.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { ProcessProfileRulesModule } from '@components/process-profile-rules/process-profile-rules.module';
import { FileAccessRulesModule } from '@components/file-access-rules/file-access-rules.module';
import { ResponseRulesModule } from '@components/response-rules/response-rules.module';
import { AdmissionRulesModule } from '@components/admission-rules/admission-rules.module';
import { NetworkRulesModule } from '@components/network-rules/network-rules.module';
import { GroupsModule } from '@components/groups/groups.module';
import {WebhooksModule} from "@components/webhooks/webhooks.module";

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
    ResponseRulesModule,
    AdmissionRulesModule,
    NetworkRulesModule,
    GroupsModule,
    WebhooksModule,
    RouterModule.forChild(routes),
  ]
})
export class FederatedPolicyModule {}
