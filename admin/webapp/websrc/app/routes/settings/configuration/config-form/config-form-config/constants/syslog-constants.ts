import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

export const SyslogProtocols = [
  { value: 6, viewValue: 'TCP' },
  { value: 17, viewValue: 'UDP' },
  { value: 66, viewValue: 'TCP + TLS' },
];

export const SyslogLevels = [
  { value: 'Critical', viewValue: 'enum.CRITICAL' },
  { value: 'Error', viewValue: 'enum.ERROR' },
  { value: 'Warning', viewValue: 'enum.WARNING' },
  { value: 'Notice', viewValue: 'enum.NOTICE' },
  { value: 'Info', viewValue: 'enum.INFO' },
];

export const SyslogCategories = [
  { value: 'event', label: 'enum.EVENT' },
  { value: 'security-event', label: 'enum.SECURITY_EVENT' },
  { value: 'audit', label: 'enum.RISK_REPORT' },
];

export const SyslogToggleField = {
  key: 'syslog.syslog_status',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'setting.SYSLOG',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogServerField = {
  key: 'syslog.syslog_ip',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.SERVER',
    maxLength: 1000,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogProtocolField = {
  key: 'syslog.syslog_ip_proto',
  type: FormlyComponents.SELECT,
  templateOptions: {
    label: 'setting.PROTOCOL',
    items: SyslogProtocols,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogPortField = {
  key: 'syslog.syslog_port',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.PORT',
    maxLength: 10,
    required: true,
  },
  validators: {
    validation: [FormlyValidators.PortRange],
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogLevelField = {
  key: 'syslog.syslog_level',
  type: FormlyComponents.SELECT,
  templateOptions: {
    label: 'setting.LEVEL',
    items: SyslogLevels,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogTLSCertificate = {
  key: 'syslog.syslog_server_cert',
  type: FormlyComponents.TEXT_AREA,
  templateOptions: {
    label: 'setting.SERVER_CERTIFICATE',
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized || !( model.syslog.syslog_ip_proto == 66 )',
  },
};

export const SyslogCategoriesField = {
  type: FormlyComponents.MULTI_CHECKBOX,
  key: 'syslog.syslog_categories',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  templateOptions: {
    hint: 'setting.LOG_CATEGORIES',
    hintClass: 'text-muted font-weight-bold',
    type: 'array',
    options: SyslogCategories,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogInJSONField = {
  type: FormlyComponents.CHECKBOX,
  key: 'syslog.syslog_in_json',
  templateOptions: {
    label: 'setting.LOG_IN_JSON',
    labelPosition: 'before',
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogSingleCVEField = {
  type: FormlyComponents.CHECKBOX,
  key: 'syslog.single_cve_per_syslog',
  templateOptions: {
    label: 'setting.SEND_SYSLOG_PER_CVE',
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};

export const SyslogCVELayersField = {
  type: FormlyComponents.CHECKBOX,
  key: 'syslog.syslog_cve_in_layers',
  templateOptions: {
    label: 'setting.SEND_SYSLOG_PER_LAYER',
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!model.syslog.syslog_status || !formState.permissions.isSyslogAuthorized',
  },
};
