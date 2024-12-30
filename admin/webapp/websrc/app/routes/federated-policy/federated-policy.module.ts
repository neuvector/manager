import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FederatedPolicyComponent } from './federated-policy.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { ProcessProfileRulesModule } from '@components/process-profile-rules/process-profile-rules.module';
import { FileAccessRulesModule } from '@components/file-access-rules/file-access-rules.module';
import { GroupDetailsModule } from '@components/group-details/group-details.module';
import { FederatedPolicyConfigurationModule } from '@components/federated-policy-configuration/federated-policy-configuration.module';
import { ResponseRulesModule } from '@components/response-rules/response-rules.module';
import { AdmissionRulesModule } from '@components/admission-rules/admission-rules.module';
import { NetworkRulesModule } from '@components/network-rules/network-rules.module';
import { GroupsModule } from '@components/groups/groups.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { DlpSensorsModule } from '@components/dlp-sensors/dlp-sensors.module';
import { WafSensorsModule } from '@components/waf-sensors/waf-sensors.module';
import { FedGroupDetailsComponent } from './fed-group-details/fed-group-details.component';

const routes: Routes = [
  { path: '', component: FederatedPolicyComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [FederatedPolicyComponent, FedGroupDetailsComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    ProcessProfileRulesModule,
    FileAccessRulesModule,
    GroupDetailsModule,
    FederatedPolicyConfigurationModule,
    ResponseRulesModule,
    AdmissionRulesModule,
    NetworkRulesModule,
    GroupsModule,
    AdjustableDivModule,
    DlpSensorsModule,
    WafSensorsModule,
    RouterModule.forChild(routes),
  ],
})
export class FederatedPolicyModule {}
