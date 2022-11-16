import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';
import {
  WebhookTableField
} from './constants';

export const FederatedConfigFormConfig: FormlyFieldConfig[] = [
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroup: [WebhookTableField],
    templateOptions: { label: 'setting.WEBHOOKS', divider: true },
  }
];
