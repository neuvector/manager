import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';
import { WebhookTableField } from './constants';

export const FederatedConfigFormConfig: FormlyFieldConfig[] = [
  {
    wrappers: [FormlyComponents.PANEL_WRAPPER],
    templateOptions: {
      label: 'setting.category.label.notification',
      description: 'setting.category.description.notification',
      expanded: true,
    },
    fieldGroup: [
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [WebhookTableField],
        templateOptions: { label: 'setting.WEBHOOKS', divider: false },
      },
    ],
  },
];
