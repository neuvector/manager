import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

const min = 60;
const hour = min * 60;
const day = hour * 24;
const week = day * 7;
export const INTERVAL_STEP_VALUES = {
  0: {
    label: 'Every 5 Minutes',
    value: min * 5,
  },
  1: {
    label: 'Every 10 Minutes',
    value: min * 10,
  },
  2: {
    label: 'Every 20 Minutes',
    value: min * 20,
  },
  3: {
    label: 'Every 30 Minutes',
    value: min * 30,
  },
  4: {
    label: 'Every 40 Minutes',
    value: min * 40,
  },
  5: {
    label: 'Every 50 Minutes',
    value: min * 50,
  },
  6: {
    label: 'Every hour',
    value: hour,
  },
  7: {
    label: 'Every 2 hours',
    value: hour * 2,
  },
  8: {
    label: 'Every 3 hours',
    value: hour * 3,
  },
  9: {
    label: 'Every 4 hours',
    value: hour * 4,
  },
  10: {
    label: 'Every 5 hours',
    value: hour * 5,
  },
  11: {
    label: 'Every 6 hours',
    value: hour * 6,
  },
  12: {
    label: 'Every 7 hours',
    value: hour * 7,
  },
  13: {
    label: 'Every 8 hours',
    value: hour * 8,
  },
  14: {
    label: 'Every 9 hours',
    value: hour * 9,
  },
  15: {
    label: 'Every 10 hours',
    value: hour * 10,
  },
  16: {
    label: 'Every 11 hours',
    value: hour * 11,
  },
  17: {
    label: 'Every 12 hours',
    value: hour * 12,
  },
  18: {
    label: 'Every 13 hours',
    value: hour * 13,
  },
  19: {
    label: 'Every 14 hours',
    value: hour * 14,
  },
  20: {
    label: 'Every 15 hours',
    value: hour * 15,
  },
  21: {
    label: 'Every 16 hours',
    value: hour * 16,
  },
  22: {
    label: 'Every 17 hours',
    value: hour * 17,
  },
  23: {
    label: 'Every 18 hours',
    value: hour * 18,
  },
  24: {
    label: 'Every 19 hours',
    value: hour * 19,
  },
  25: {
    label: 'Every 20 hours',
    value: hour * 20,
  },
  26: {
    label: 'Every 21 hours',
    value: hour * 21,
  },
  27: {
    label: 'Every 22 hours',
    value: hour * 22,
  },
  28: {
    label: 'Every 23 hours',
    value: hour * 23,
  },
  29: {
    label: 'Every day',
    value: day,
  },
  30: {
    label: 'Every 2 days',
    value: day * 2,
  },
  31: {
    label: 'Every 3 days',
    value: day * 3,
  },
  32: {
    label: 'Every 4 days',
    value: day * 4,
  },
  33: {
    label: 'Every 5 days',
    value: day * 5,
  },
  34: {
    label: 'Every 6 days',
    value: day * 6,
  },
  35: {
    label: 'Every week',
    value: week,
  },
};

export const Registries = {
  AMAZON_ECR_REGISTRY: 'Amazon ECR Registry',
  AZURE_CONTAINER_REGISTRY: 'Azure Container Registry',
  DOCKER_REGISTRY: 'Docker Registry',
  GITLAB: 'Gitlab',
  GOOGLE_CONTAINER_REGISTRY: 'Google Container Registry',
  IBM_CLOUD_CONTAINER_REGISTRY: 'IBM Cloud Container Registry',
  OPENSHIFT_REGISTRY: 'OpenShift Registry',
  JFROG_ARTIFACTORY: 'JFrog Artifactory',
  REDHAT_PUBLIC_REGISTRY: 'Red Hat Public Registry',
  SONATYPE_NEXUS: 'Sonatype Nexus',
};

export const NameField = {
  key: 'name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'sell',
    label: 'general.NAME',
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': 'model.isEdit',
  },
};

export const RegistryField = {
  key: 'registry',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: '',
    icon: 'workspaces',
    label: 'registry.gridHeader.REGISTRY',
    required: true,
  },
  validators: {
    validation: [FormlyValidators.URL],
  },
};

export const UsernameField = {
  key: 'username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'person',
    label: 'registry.gridHeader.USERNAME',
  },
};

export const PasswordField = {
  key: 'password',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: '',
    required: true,
    togglePassword: true,
    type: 'password',
    icon: 'vpn_key',
    label: 'login.PASSWORD',
  },
};

export const FilterField = {
  key: 'filters',
  defaultValue: [],
  type: FormlyComponents.CHIP_INPUT,
  templateOptions: {
    hint: 'registry.FILTER_HINT',
    required: true,
    label: 'registry.gridHeader.FILTER',
    placeholder: 'general.FILTER',
  },
};

export const RescanField = {
  key: 'rescan_after_db_update',
  defaultValue: true,
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'registry.RESCAN_AFTER_DB_UPDATED',
  },
};

export const ScanLayersField = {
  key: 'scan_layers',
  defaultValue: false,
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'registry.SCAN_LAYERS',
  },
};

export const PeriodicScanField = {
  key: 'periodic_scan',
  defaultValue: false,
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'registry.SCHEDULE2',
  },
};

export const AutoScanField = {
  key: 'auto_scan',
  defaultValue: false,
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    label: 'scan.AUTO',
  },
};

export const IntervalField = {
  defaultValue: 0,
  key: 'interval',
  type: FormlyComponents.SLIDER,
  templateOptions: {
    stepValues: {
      ...Object.keys(INTERVAL_STEP_VALUES).map(
        key => INTERVAL_STEP_VALUES[key].label
      ),
    },
    max: 35,
    min: 0,
    step: 1,
    id: 'interval-label',
    label: 'registry.INTERVAL',
  },
};

export const IdField = {
  key: 'id',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'featured_video',
    label: 'registry.AWS_ID',
    required: true,
  },
};

export const AccessKeyField = {
  key: 'access_key_id',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    maskOnBlur: true,
    icon: 'vpn_key',
    label: 'registry.AWS_ACCESS_KEY',
  },
};

export const RegionField = {
  key: 'region',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'network',
    label: 'registry.AWS_REGION',
    required: true,
  },
};

export const SecretAccessKeyField = {
  key: 'secret_access_key',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    maskOnBlur: true,
    icon: 'vpn_key',
    label: 'registry.AWS_SECRET_KEY',
  },
};

export const PrivateTokenField = {
  key: 'gitlab_private_token',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    maskOnBlur: true,
    icon: 'vpn_key',
    label: 'registry.GITLAB_PRIVATE_TOKEN',
  },
};

export const ExternalUrlField = {
  key: 'gitlab_external_url',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: '',
    icon: 'network',
    label: 'registry.GITLAB_EXTERNAL_URL',
    required: true,
  },
  validators: {
    validation: [FormlyValidators.URL],
  },
};

export const JsonKeyField = {
  key: 'json_key',
  type: FormlyComponents.TEXT_AREA,
  templateOptions: {
    label: 'registry.gridHeader.JSON_KEY',
    required: true,
  },
};

export const IBMCloudAccountField = {
  key: 'ibm_cloud_account',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'network',
    label: 'registry.IBM.ACCOUNT',
    required: true,
    hint: 'registry.IBM.GET_ACCOUNT_HINT',
  },
};

export const JFROGAccessMethodField = {
  defaultValue: 'Repository Path',
  key: 'jfrog_mode',
  type: FormlyComponents.SELECT,
  templateOptions: {
    items: [
      { value: 'Repository Path', viewValue: 'Repository Path' },
      { value: 'Subdomain', viewValue: 'Subdomain' },
      { value: 'Port', viewValue: 'Port' },
    ],
    icon: 'storage',
    label: 'registry.JFROG_MODE',
  },
};

export const AuthenticationTypeField = {
  defaultValue: false,
  key: 'auth_with_token',
  type: FormlyComponents.RADIO,
  templateOptions: {
    items: [
      { value: false, viewValue: 'registry.AUTH_BY_UN' },
      { value: true, viewValue: 'registry.AUTH_BY_TOKEN' },
    ],
  },
};

export const TokenAuthenticationField = {
  key: 'auth_token',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'vpn_key',
    label: 'ldap.TOKEN',
  },
};
