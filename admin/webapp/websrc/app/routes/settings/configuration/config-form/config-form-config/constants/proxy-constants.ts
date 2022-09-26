import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

export const HTTPProxyStatusField = {
  key: 'registry_http_proxy_status',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'setting.REG_HTTP_PROXY',
    labelPosition: 'before',
    fixed: 'sm',
  },
};

export const HTTPProxyURLField = {
  key: 'registry_http_proxy.url',
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
    'templateOptions.disabled': '!model.registry_http_proxy_status',
  },
};

export const HTTPProxyUsernameField = {
  key: 'registry_http_proxy.username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.USERNAME',
    maxLength: 1000,
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.registry_http_proxy_status',
  },
};

export const HTTPProxyPasswordField = {
  key: 'registry_http_proxy.password',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.PASSWORD',
    maxLength: 1000,
    togglePassword: true,
    type: 'password',
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.registry_http_proxy_status',
  },
};

export const HTTPSProxyStatusField = {
  key: 'registry_https_proxy_status',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'setting.REG_HTTPS_PROXY',
    labelPosition: 'before',
    fixed: 'sm',
  },
};

export const HTTPSProxyURLField = {
  key: 'registry_https_proxy.url',
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
    'templateOptions.disabled': '!model.registry_https_proxy_status',
  },
};

export const HTTPSProxyUsernameField = {
  key: 'registry_https_proxy.username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.USERNAME',
    maxLength: 1000,
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.registry_https_proxy_status',
  },
};

export const HTTPSProxyPasswordField = {
  key: 'registry_https_proxy.password',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.PASSWORD',
    maxLength: 1000,
    togglePassword: true,
    type: 'password',
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.registry_https_proxy_status',
  },
};
