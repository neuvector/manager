import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';
import {
  AuthByOpenshiftField,
  AuthByOpenshiftHideExpr,
  ClusterNameField,
  D2MDurationField,
  D2MToggleField,
  DurationSliderField,
  DurationToggleField,
  HTTPProxyPasswordField,
  HTTPProxyStatusField,
  HTTPProxyURLField,
  HTTPProxyUsernameField,
  HTTPSProxyPasswordField,
  HTTPSProxyStatusField,
  HTTPSProxyURLField,
  HTTPSProxyUsernameField,
  IBMSADashboardURLField,
  IBMSASetupExpirationField,
  IBMSASetupField,
  IBMSASetupURLField,
  IBMSAStartField,
  IBMSAToggleField,
  M2PDurationField,
  M2PToggleField,
  NetworkServiceModeField,
  NetworkServiceStatusField,
  ProfileBaselineBoolField,
  ProfileBaselineField,
  RancherEpField,
  ScannerAutoscaleField,
  ScannerAutoscaleHideExpr,
  ScannerAutoscaleMaxField,
  ScannerAutoscaleMinField,
  ScannerAutoscaleMinMaxField,
  ServiceModeField,
  ServiceProfileModeField,
  SyslogCategoriesField,
  SyslogInJSONField,
  SyslogLevelField,
  SyslogPortField,
  SyslogProtocolField,
  SyslogServerField,
  SyslogSingleCVEField,
  SyslogToggleField,
  TelemetryToggleBoolField,
  TelemetryToggleField,
  WebhookTableField,
  XFFToggleField,
  DisableNetworkPolicyToggleBoolField,
  DisableNetworkPolicyToggleField,
  SyslogTLSCertificate,
  SyslogCVELayersField,
  EventReportLoggingToggleField,
  NsUserExportNetworkRuleToggleField,
  RestrictGroupModeField,
} from './constants';
import {
  EnableTlsVerificationToggleField,
  TlsTableField,
  tlsVerificationNoticeField,
} from './constants/tls-constants';

export const ConfigFormConfig: FormlyFieldConfig[] = [
  {
    wrappers: [FormlyComponents.PANEL_WRAPPER],
    templateOptions: {
      label: 'setting.category.label.policy',
      description: 'setting.category.description.policy',
      expanded: true,
    },
    fieldGroup: [
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-12 my-md-2',
            ...ServiceModeField,
          },
          {
            className: 'col-12 my-md-2',
            ...ServiceProfileModeField,
          },
          {
            className: 'col-12 my-md-2',
            ...ProfileBaselineBoolField,
          },
          ProfileBaselineField,
        ],
        templateOptions: { label: 'setting.NEW_SERVICE', divider: false },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [NetworkServiceStatusField],
        templateOptions: {
          label: 'setting.NET_SERVICE_POLICY_MODE',
          appendTo: true,
          inline: true,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [
          {
            className: 'mx-3 my-md-4',
            ...NetworkServiceModeField,
          },
        ],
        templateOptions: { append: true, divider: false },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [
          {
            fieldGroupClassName: 'row align-items-center',
            fieldGroup: [
              {
                className: 'col-md-3 pt-3',
                ...D2MToggleField,
              },
              {
                className: 'col-md-9',
                ...D2MDurationField,
              },
            ],
          },
          {
            fieldGroupClassName: 'row align-items-center',
            fieldGroup: [
              {
                className: 'col-md-3 pt-3',
                ...M2PToggleField,
              },
              {
                className: 'col-md-9',
                ...M2PDurationField,
              },
            ],
          },
        ],
        templateOptions: {
          label: 'setting.MODE_AUTO_SWITCH',
          comment: 'setting.MODE_AUTO_SWITCH_HINT',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroupClassName: 'row align-items-center',
        fieldGroup: [
          {
            className: 'col-md-2 pt-3',
            ...DurationToggleField,
          },
          {
            className: 'col',
            ...DurationSliderField,
          },
        ],
        templateOptions: {
          label: 'setting.UNUSED_GROUP_AGE',
          comment: 'setting.UNUSED_GROUP_HINT',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-12 my-md-2',
            ...RestrictGroupModeField,
          },
        ],
        templateOptions: {
          label: 'setting.STRICT_GROUP_MODE',
          comment: [
            'setting.STRICT_GROUP_MODE_HINT_1',
            'setting.STRICT_GROUP_MODE_HINT_2',
            'setting.STRICT_GROUP_MODE_HINT_3',
          ],
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [
          DisableNetworkPolicyToggleBoolField,
          DisableNetworkPolicyToggleField,
        ],
        templateOptions: {
          label: 'setting.DISABLE_NET_POLICY',
          comment: 'setting.DISABLE_NET_POLICY_HINT',
          inline: true,
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [XFFToggleField],
        templateOptions: {
          label: 'setting.XFF_MATCH',
          inline: true,
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [NsUserExportNetworkRuleToggleField],
        templateOptions: {
          label: 'setting.NS_USER_EXPORT_NET_POLICY',
          comment: 'setting.NS_USER_EXPORT_NET_POLICY_HINT',
          inline: true,
          divider: false,
        },
      },
    ],
  },
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
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-12',
            ...SyslogToggleField,
          },
          {
            hideExpression: `!model.syslog.syslog_status`,
            className: 'col-12',
            ...SyslogServerField,
          },
          {
            hideExpression: `!model.syslog.syslog_status`,
            className: 'col-12 ms-3',
            ...SyslogProtocolField,
          },
          {
            hideExpression: `!model.syslog.syslog_status || model.syslog.syslog_ip_proto != 66`,
            className: 'col-12 ms-3',
            ...SyslogTLSCertificate,
          },
          {
            hideExpression: `!model.syslog.syslog_status`,
            className: 'col-12',
            ...SyslogPortField,
          },
          {
            className: 'col-12 mt-3',
            ...EventReportLoggingToggleField,
          },
          {
            className: 'col-12 col-md-4 mt-3 ms-3',
            ...SyslogLevelField,
          },
          {
            className: 'col-12 col-md-8 ms-3',
            ...SyslogCategoriesField,
          },
          {
            className: 'col-12 col-md-3',
            ...SyslogInJSONField,
          },
          {
            className: 'col-12 mt-3',
            ...SyslogSingleCVEField,
          },
          {
            className: 'col-12',
            ...SyslogCVELayersField,
          },
        ],
        templateOptions: {
          label: 'setting.NOTIFICATIONS',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [WebhookTableField],
        templateOptions: { label: 'setting.WEBHOOKS', divider: false },
      },
    ],
  },
  {
    wrappers: [FormlyComponents.PANEL_WRAPPER],
    templateOptions: {
      label: 'setting.category.label.general',
      description: 'setting.category.description.general',
      expanded: true,
    },
    fieldGroup: [
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [
          {
            className: 'mx-3 my-md-4',
            ...ClusterNameField,
          },
        ],
        templateOptions: {
          label: 'setting.CLUSTER',
          comment: 'setting.CLUSTER_COMMENT',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [AuthByOpenshiftField],
        templateOptions: {
          label: 'setting.AUTH_BY_OPENSHIFT',
          appendTo: true,
          inline: true,
        },
        hideExpression: AuthByOpenshiftHideExpr,
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [
          {
            className: 'mx-3 my-md-4',
            ...RancherEpField,
          },
        ],
        templateOptions: { append: true, divider: false },
        hideExpression: AuthByOpenshiftHideExpr,
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-12 my-md-2',
            ...ScannerAutoscaleField,
          },
          {
            className: 'col-12 my-md-2',
            fieldGroupClassName: 'row align-items-center',
            fieldGroup: [
              {
                className: 'col-md-2',
                template: '',
                expressionProperties: {
                  template: (_model, formState, _field) => {
                    return `<div class="ms-3"><strong>${formState.tr.min_max}</strong></div>`;
                  },
                },
              },
              {
                className: 'offset-md-1 col-md-9',
                ...ScannerAutoscaleMinMaxField,
              },
            ],
          },
          ScannerAutoscaleMinField,
          ScannerAutoscaleMaxField,
        ],
        hideExpression: ScannerAutoscaleHideExpr,
        templateOptions: {
          label: 'setting.autoscale.TITLE',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroupClassName: 'row align-items-center',
        fieldGroup: [
          {
            className: 'col-12 mt-3',
            ...HTTPProxyStatusField,
          },
          {
            className: 'col-12',
            ...HTTPProxyURLField,
          },
          {
            className: 'col-12',
            ...HTTPProxyUsernameField,
          },
          {
            className: 'col-12',
            ...HTTPProxyPasswordField,
          },
          {
            className: 'col-12 mt-3',
            ...HTTPSProxyStatusField,
          },
          {
            className: 'col-12',
            ...HTTPSProxyURLField,
          },
          {
            className: 'col-12',
            ...HTTPSProxyUsernameField,
          },
          {
            className: 'col-12',
            ...HTTPSProxyPasswordField,
          },
        ],
        templateOptions: {
          label: 'setting.REG_PROXY',
          comment: 'setting.PROXY_HINT',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [TelemetryToggleBoolField, TelemetryToggleField],
        templateOptions: {
          label: 'setting.TELEMETRY',
          comment: 'setting.TELEMETRY_HINT',
          inline: true,
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [IBMSAToggleField, IBMSAStartField],
        templateOptions: {
          label: 'setting.IBM_INTEGRATE',
          appendTo: true,
          inline: true,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroupClassName: 'row align-items-center',
        fieldGroup: [
          {
            className: 'col-12',
            ...IBMSADashboardURLField,
          },
          {
            className: 'col-12 col-md-1',
            ...IBMSASetupField,
          },
          {
            className: 'col-12 col-md-8',
            ...IBMSASetupURLField,
          },
          IBMSASetupExpirationField,
        ],
        templateOptions: { append: true },
      },
    ],
  },
  {
    wrappers: [FormlyComponents.PANEL_WRAPPER],
    templateOptions: {
      label: 'setting.category.label.tls_self_signed_certification',
      description: 'setting.category.description.tls_self_signed_certification',
      expanded: true,
    },
    fieldGroupClassName: 'self-signed-cert',
    fieldGroup: [
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [tlsVerificationNoticeField],
        templateOptions: {
          label: 'setting.NOTICE',
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [EnableTlsVerificationToggleField],
        templateOptions: {
          label: 'setting.ENABLE_TLS_VERIFICATION',
          inline: true,
          divider: false,
        },
      },
      {
        wrappers: [FormlyComponents.SECTION_WRAPPER],
        fieldGroup: [TlsTableField],
        templateOptions: {
          label: 'setting.TLS_SELF_SIGNED_CERTIFICATION_CONTEXT',
          divider: false,
        },
      },
    ],
  },
];
