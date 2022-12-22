import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

export const OtherWebhookType = 'OTHER';
export const WebhookTypes = [
  { value: 'Slack', viewValue: 'Slack', iconClass: 'fab fa-slack' },
  { value: 'Teams', viewValue: 'MS Teams' },
  { value: 'JSON', viewValue: 'JSON' },
  { value: 'OTHER', viewValue: 'Key-Value Pairs' },
];

export const WebhookTableField = {
  key: 'webhooks',
  type: FormlyComponents.EDIT_TABLE,
  templateOptions: {
    cellHeight: '75px',
    addButtonText: 'setting.webhook.NEW',
  },
  fieldArray: {
    validators: {
      validation: [
        { name: FormlyValidators.FedName, options: { errorPath: 'name' } },
      ],
    },
    fieldGroup: [
      {
        key: 'name',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.ICON_INPUT,
        defaultValue: "fed.",
        templateOptions: {
          viewValue: 'setting.webhook.NAME',
          label: 'setting.webhook.NAME',
          isCell: true,
          required: true,
          maxLength: 1000,
          readOnly: {
            type: 'text',
            template: field => `${field.model[field.key] || ''}`,
          },
        },
        validators: {
          validation: [FormlyValidators.ObjName],
        },
      },
      {
        key: 'url',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.ICON_INPUT,
        templateOptions: {
          viewValue: 'setting.webhook.URL',
          label: 'setting.webhook.URL',
          isCell: true,
          required: true,
          maxLength: 1000,
          readOnly: {
            type: 'text',
            template: field => `${field.model[field.key] || ''}`,
          },
        },
        validators: {
          validation: [FormlyValidators.URL],
        },
      },
      {
        key: 'type',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.SELECT,
        templateOptions: {
          viewValue: 'setting.webhook.WH_TYPE',
          label: 'setting.webhook.WH_TYPE',
          items: WebhookTypes,
          required: true,
          readOnly: {
            type: 'icon',
            template: field => {
              let item = field.templateOptions.items.find(
                i => i.value === field.model[field.key]
              );
              return {
                text: item.viewValue,
                iconClass: item.iconClass,
                badgeClass:
                  item.value === 'OTHER'
                    ? ''
                    : 'badge ag-badge bg-info text-light',
              };
            },
          },
        },
      },
      {
        key: 'enable',
        type: FormlyComponents.TOGGLE,
        defaultValue: true,
        templateOptions: {
          viewValue: 'setting.webhook.STATUS',
          flexWidth: '10%',
          align: 'center',
          ariaLabelledBy: 'setting.webhook.STATUS',
        }
      },
      {
        key: 'cfg_type',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.ICON_INPUT,
        defaultValue: GlobalConstant.CFG_TYPE.FED,
        templateOptions: {
          viewValue: 'setting.webhook.TYPE',
          flexWidth: '10%',
          isCell: true,
          readOnly: {
            type: 'icon',
            template: field => {
              let key = field.model[field.key];
              if (key) {
                return {
                  text: 'group.' + key.toUpperCase(),
                  badgeClass:
                    'badge ag-badge ' +
                    MapConstant.colourMap[key.toUpperCase()],
                };
              }
              return { text: key, badgeClass: 'badge ag-badge' };
            },
            always: true,
          },
        },
      },
      {
        key: 'isEditable',
        type: FormlyComponents.EDIT_TABLE_CONTROLS,
        defaultValue: true,
        templateOptions: {
          flexWidth: '20%',
        },
        expressionProperties: {
          'templateOptions.disabled': model => {
            return model.cfg_type !== GlobalConstant.CFG_TYPE.FED;
          },
        },
      },
    ],
  },
};
