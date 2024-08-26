import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

export const WebhookTypes = [
  { value: 'Slack', viewValue: 'Slack', iconClass: 'fab fa-slack' },
  { value: 'Teams', viewValue: 'MS Teams/Datadog' },
  { value: 'JSON', viewValue: 'JSON' },
  { value: 'OTHER', viewValue: 'Key-Value Pairs' },
];

export const WebhookTableField = {
  key: 'webhooks',
  type: FormlyComponents.EDIT_TABLE,
  templateOptions: {
    cellHeight: '75px',
    addButtonText: 'setting.webhook.ADD',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.permissions.isWebhookAuthorized',
  },
  fieldArray: {
    fieldGroup: [
      {
        key: 'name',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.ICON_INPUT,
        defaultValue: 'fed.',
        templateOptions: {
          viewValue: 'setting.webhook.NAME',
          placeholder: 'setting.webhook.NAME',
          isCell: true,
          required: true,
          hideRequiredMarker: true,
          maxLength: 1000,
          readOnly: {
            type: 'text',
            template: field => `${field.model[field.key] || ''}`,
          },
        },
        validators: {
          validation: [FormlyValidators.ObjName, FormlyValidators.FedName],
        },
      },
      {
        key: 'url',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.ICON_INPUT,
        templateOptions: {
          viewValue: 'setting.webhook.URL',
          placeholder: 'setting.webhook.URL',
          isCell: true,
          required: true,
          hideRequiredMarker: true,
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
        defaultValue: WebhookTypes[3].value,
        templateOptions: {
          viewValue: 'setting.webhook.WH_TYPE',
          placeholder: 'setting.webhook.WH_TYPE',
          items: WebhookTypes,
          hideRequiredMarker: true,
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
        },
        expressionProperties: {
          'templateOptions.disabled': model => {
            return !model.isEditable;
          },
        },
      },
      {
        key: 'use_proxy',
        type: FormlyComponents.CHECKBOX,
        defaultValue: false,
        templateOptions: {
          viewValue: 'setting.webhook.USE_PROXY',
          flexWidth: '100px',
          align: 'center',
        },
        expressionProperties: {
          'templateOptions.disabled': model => {
            return !model.isEditable;
          },
        },
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
        type: FormlyComponents.EDIT_WEBHOOK_TABLE_CONTROLS,
        defaultValue: true,
        templateOptions: {
          flexWidth: '20%',
        },
        expressionProperties: {
          'templateOptions.disabled': (model, formState) => {
            return (
              !formState.permissions.isWebhookAuthorized ||
              model.cfg_type !== GlobalConstant.CFG_TYPE.FED
            );
          },
        },
      },
    ],
  },
};
