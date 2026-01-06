import { GlobalConstant } from '@common/constants/global.constant';
import {
  CardSeverity,
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';
import {
  CertificateDeserializer,
  CertificateManifest,
} from '@common/types/settings/certificate';
import { FormlyFieldConfig } from '@ngx-formly/core';
import * as moment from 'moment';

export const tlsVerificationNoticeField = {
  type: FormlyComponents.CARD,
  templateOptions: {
    header: 'setting.tls.APPLICABLE_NOTICE.HEADER',
    content: [
      'setting.tls.APPLICABLE_NOTICE.APPLICABLE_SERVICES.REGISTRY',
      'setting.tls.APPLICABLE_NOTICE.APPLICABLE_SERVICES.AUTH',
      'setting.tls.APPLICABLE_NOTICE.APPLICABLE_SERVICES.WEBHOOK',
    ],
    isBulletMode: true,
    severity: CardSeverity.WARNING,
  },
};

export const EnableTlsVerificationToggleField = {
  key: 'tls.enable_tls_verification',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'setting.ENABLE_TLS_VERIFICATION',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.permissions.isTlsAuthorized',
  },
};

export const TlsTableField: FormlyFieldConfig = {
  key: 'tls.cacerts',
  type: FormlyComponents.EDIT_TABLE,
  templateOptions: {
    addButtonText: 'setting.tls.ADD',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.permissions.isTlsAuthorized',
  },
  fieldArray: {
    fieldGroup: [
      {
        type: FormlyComponents.CARD,
        templateOptions: {
          viewValue: 'setting.tls.MANIFEST',
          flexWidth: '37%',
          isBulletMode: true,
          isPlainOutfitMode: true,
        },
        expressionProperties: {
          'templateOptions.content': (model, formState, field) => {
            const certificateDeserializer: CertificateDeserializer =
              CertificateDeserializer.getInstance();
            const context: string = field?.model['context'];

            try {
              const cert = certificateDeserializer.getCertificate(context);
              const manifest: CertificateManifest =
                certificateDeserializer.getMainfest(cert);

              return {
                'setting.tls.CERTIFICATE_MANIFEST.COMMON_NAME':
                  manifest.commonName?.value,
                'setting.tls.CERTIFICATE_MANIFEST.ISSUER': manifest.issuer,
                'setting.tls.CERTIFICATE_MANIFEST.VALID_FROM': moment(
                  manifest.validFrom
                ).format('YYYY-MM-DD HH:mm:ss'),
                'setting.tls.CERTIFICATE_MANIFEST.VALID_TO': moment(
                  manifest.validTo
                ).format('YYYY-MM-DD HH:mm:ss'),
                'setting.tls.CERTIFICATE_MANIFEST.DAYS_LEFT': manifest.daysLeft,
              };
            } catch (e) {
              return {};
            }
          },
        },
      },
      {
        key: 'context',
        wrappers: [FormlyComponents.READONLY_WRAPPER],
        type: FormlyComponents.TEXT_AREA,
        templateOptions: {
          viewValue: 'setting.tls.CERTIFICATE',
          label: 'setting.tls.CERTIFICATE_CONTEXT',
          isCell: true,
          required: true,
          hideRequiredMarker: true,
          rows: 15,
          readOnly: {
            type: 'text',
            template: field => `${field.model[field.key] || ''}`,
          },
        },
        validators: {
          validation: [FormlyValidators.Certificate],
        },
      },
      {
        key: 'isEditable',
        type: FormlyComponents.EDIT_TABLE_CONTROLS,
        defaultValue: true,
        templateOptions: {
          flexWidth: '10%',
          showDeleteButtonOnly: true,
          fieldClass: 'justify-content-center',
        },
        expressionProperties: {
          'templateOptions.disabled': (model, formState, _field) => {
            return (
              !formState.permissions.isTlsAuthorized ||
              model.cfg_type === GlobalConstant.CFG_TYPE.FED
            );
          },
        },
      },
    ],
  },
};
