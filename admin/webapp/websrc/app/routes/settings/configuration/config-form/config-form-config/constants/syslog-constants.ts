import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

export const SyslogProtocols = [
  { value: 6, viewValue: 'TCP' },
  { value: 17, viewValue: 'UDP' },
];

export const SyslogLevels = [
  { value: 'Critical', viewValue: 'Critical' },
  { value: 'Error', viewValue: 'Error' },
  { value: 'Warning', viewValue: 'Warning' },
  { value: 'Notice', viewValue: 'Notice' },
  { value: 'Info', viewValue: 'Info' },
];

export const SyslogCategories = [
  { value: 'event', label: 'Event' },
  { value: 'security-event', label: 'Security Event' },
  { value: 'audit', label: 'Risk Reports' },
];

export const SyslogToggleField = {
  key: 'syslog_status',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'setting.SYSLOG',
  },
};

export const SyslogServerField = {
  key: 'syslog_ip',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.SERVER',
    maxLength: 1000,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.syslog_status',
  },
};

export const SyslogProtocolField = {
  key: 'syslog_ip_proto',
  type: FormlyComponents.SELECT,
  templateOptions: {
    label: 'setting.PROTOCOL',
    items: SyslogProtocols,
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.syslog_status',
  },
};

export const SyslogPortField = {
  key: 'syslog_port',
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
    'templateOptions.disabled': '!model.syslog_status',
  },
};

export const SyslogLevelField = {
  key: 'syslog_level',
  type: FormlyComponents.SELECT,
  templateOptions: {
    label: 'setting.LEVEL',
    items: SyslogLevels,
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.syslog_status',
  },
};

export const SyslogCategoriesField = {
  type: 'multicheckbox',
  key: 'syslog_categories',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  templateOptions: {
    hint: 'setting.LOG_CATEGORIES',
    hintClass: 'text-muted font-weight-bold',
    type: 'array',
    options: SyslogCategories,
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.syslog_status',
  },
};

export const SyslogInJSONField = {
  type: FormlyComponents.CHECKBOX,
  key: 'syslog_in_json',
  templateOptions: {
    label: 'setting.LOG_IN_JSON',
    labelPosition: 'before',
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.syslog_status',
  },
};

export const SyslogSingleCVEField = {
  type: FormlyComponents.CHECKBOX,
  key: 'single_cve_per_syslog',
  templateOptions: {
    label: 'setting.SEND_SYSLOG_PER_CVE',
  },
  expressionProperties: {
    'templateOptions.disabled': '!model.syslog_status',
  },
};
