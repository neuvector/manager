import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebhooksComponent } from './webhooks.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AgGridModule } from 'ag-grid-angular';
import { ActionButtonsComponent } from './partial/action-buttons/action-buttons.component';
import { AddEditWebhookModalComponent } from './partial/add-edit-webhook-modal/add-edit-webhook-modal.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';

import { WebhookService } from '@services/webhook.service';

@NgModule({
  declarations: [
    WebhooksComponent,
    ActionButtonsComponent,
    AddEditWebhookModalComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    AgGridModule.withComponents([
      ActionButtonsComponent,
      AddEditWebhookModalComponent,
    ]),
    LoadingButtonModule,
    LoadingTemplateModule,
  ],
  exports: [WebhooksComponent],
  providers: [WebhookService],
  entryComponents: [AddEditWebhookModalComponent],
})
export class WebhooksModule {}
