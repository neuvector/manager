import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';
import { FormlyFieldConfig } from '@ngx-formly/core';

export const HTTPProxyStatusField = {
  key: 'proxy.registry_http_proxy_status',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'setting.REG_HTTP_PROXY',
    labelPosition: 'before',
    fixed: 'sm',
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!formState.permissions.isRegHttpProxyAuthorized',
  },
};

export const HTTPProxyURLField = {
  key: 'proxy.registry_http_proxy.url',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.URL',
    maxLength: 1000,
    required: true,
  },
  validators: {
    validation: [FormlyValidators.URL],
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.proxy.registry_http_proxy_status || !formState.permissions.isRegHttpProxyAuthorized',
  },
};

export const HTTPProxyUsernameField = {
  key: 'proxy.registry_http_proxy.username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.USERNAME',
    maxLength: 1000,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.proxy.registry_http_proxy_status || !formState.permissions.isRegHttpProxyAuthorized',
  },
};

export const HTTPProxyPasswordField = {
  key: 'proxy.registry_http_proxy.password',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.PASSWORD',
    maxLength: 1000,
    togglePassword: true,
    type: 'password',
  },
  expressionProperties: {
    'templateOptions.floatLabel': 'formState.isCreated.httpProxy',
    'templateOptions.placeholder': (_model, formState, _field) => {
      return formState.isCreated.httpProxy ? '******' : '';
    },
    'templateOptions.disabled':
      '!model.proxy.registry_http_proxy_status || !formState.permissions.isRegHttpProxyAuthorized',
  },
};

export const HTTPSProxyStatusField = {
  key: 'proxy.registry_https_proxy_status',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'setting.REG_HTTPS_PROXY',
    labelPosition: 'before',
    fixed: 'sm',
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!formState.permissions.isRegHttpsProxyAuthorized',
  },
};

export const HTTPSProxyURLField = {
  key: 'proxy.registry_https_proxy.url',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.URL',
    maxLength: 1000,
    required: true,
  },
  validators: {
    validation: [FormlyValidators.URL],
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.proxy.registry_https_proxy_status || !formState.permissions.isRegHttpsProxyAuthorized',
  },
};

export const HTTPSProxyUsernameField = {
  key: 'proxy.registry_https_proxy.username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.USERNAME',
    maxLength: 1000,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.proxy.registry_https_proxy_status || !formState.permissions.isRegHttpsProxyAuthorized',
  },
};

export const HTTPSProxyPasswordField = {
  key: 'proxy.registry_https_proxy.password',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.PASSWORD',
    maxLength: 1000,
    togglePassword: true,
    type: 'password',
  },
  expressionProperties: {
    'templateOptions.floatLabel': 'formState.isCreated.httpsProxy',
    'templateOptions.placeholder': (_model, formState, _field) => {
      return formState.isCreated.httpsProxy ? '******' : '';
    },
    'templateOptions.disabled':
      '!model.proxy.registry_https_proxy_status || !formState.permissions.isRegHttpsProxyAuthorized',
  },
};
