import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FederatedPolicyConfigurationComponent } from './federated-policy-configuration.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { FederatedConfigFormComponent } from './federated-config-form/federated-config-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NeuVectorFormlyModule } from '@common/neuvector-formly/neuvector-formly.module';
import { FederatedConfigurationService } from '@services/federated-configuration.service';

@NgModule({
  declarations: [
    FederatedPolicyConfigurationComponent,
    FederatedConfigFormComponent,
  ],
  exports: [FederatedPolicyConfigurationComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FormsModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    NeuVectorFormlyModule,
  ],
  providers: [FederatedConfigurationService],
})
export class FederatedPolicyConfigurationModule {}
