import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';

export const IBMSAToggleField = {
  key: 'ibmsa_ep_enabled',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'setting.IBM_INTEGRATE',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.permissions.isIBMSAAuthorized',
  },
  hooks: {
    onInit: field => {
      const ctrl = field.formControl;
      ctrl.valueChanges.subscribe((enabled: boolean) => {
        if (!enabled) {
          console.log('disabled');
          field.parent.formControl.get('ibmsa_setup').patchValue({
            url: '',
            expiring_time: '',
          });
        }
      });
    },
  },
};

export const IBMSAStartField = {
  key: 'ibmsa_ep_start',
};

export const IBMSADashboardURLField = {
  key: 'ibmsa_ep_dashboard_url',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.DASHBOARD_URL',
  },
  expressionProperties: {
    'templateOptions.disabled':
      'model.ibmsa_ep_start === 1 || !formState.permissions.isIBMSAAuthorized',
  },
};

export const IBMSASetupField = {
  type: FormlyComponents.BUTTON,
  templateOptions: {
    label: 'setting.GET_URL',
    type: 'button',
    onClick: ($event, formState) => formState.ibmsa.setup($event),
  },
  hideExpression: (model, formState, field) => {
    return (
      !formState.permissions.isIBMSAAuthorized ||
      !model.ibmsa_ep_enabled ||
      model.ibmsa_ep_start === 1 ||
      field.parent?.formControl?.get('ibmsa_ep_enabled')?.dirty
    );
  },
};

export const IBMSASetupURLField = {
  key: 'ibmsa_setup.url',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    label: 'setting.IBM_SETUP_URL',
    hint: '',
    hintDanger: true,
    copyClipboard: true,
    disabled: true,
  },
  hideExpression: (model, formState, field) => {
    return (
      !formState.permissions.isIBMSAAuthorized ||
      !model.ibmsa_ep_enabled ||
      model.ibmsa_ep_start === 1 ||
      field.parent?.formControl?.get('ibmsa_ep_enabled')?.dirty
    );
  },
  hooks: {
    onInit: field => {
      const ctrl = field.parent.formControl.get('ibmsa_setup.expiring_time');
      ctrl.valueChanges.subscribe((expiring_time: string) => {
        field.templateOptions.hint = expiring_time;
      });
    },
  },
};

export const IBMSASetupExpirationField = {
  key: 'ibmsa_setup.expiring_time',
};
