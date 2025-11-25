import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';
import { FormlyFieldConfig } from '@ngx-formly/core';

export const NickNameField = {
  key: 'nickname',
  type: FormlyComponents.ICON_INPUT,
  defaultValue: 'default',
  expressionProperties: {
    'templateOptions.disabled': () => true,
  },
  templateOptions: {
    icon: 'sell',
    label: 'setting.remote_repository.details.name',
    hint: 'setting.remote_repository.details.name_hint',
    maxLength: 1000,
    required: true,
  },
};

export const ProviderField = {
  key: 'provider',
  type: FormlyComponents.SELECT,
  templateOptions: {
    change: field => {
      field.options?.parentForm?.form.markAsPristine();
      field.options?.parentForm?.form.markAsUntouched();
      field.options?.parentForm?.form.updateValueAndValidity();
    },
    label: 'setting.remote_repository.details.provider',
    icon: 'workspaces',
    hint: 'setting.remote_repository.details.provider_hint',
    required: true,
  },
  expressionProperties: {
    'templateOptions.items': 'model.providerTypes',
  },
  hooks: {
    onInit: field => {
      field?.formControl?.setValue(
        field.model.provider || field.model.providerTypes[0].value
      );
    },
  },
};

export const CommentField = {
  key: 'comment',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'comment',
    label: 'setting.remote_repository.details.comment',
    maxLength: 1000,
  },
};

export const EnabledField = {
  key: 'enable',
  type: FormlyComponents.TOGGLE,
  defaultValue: true,
  templateOptions: {
    label: 'setting.remote_repository.details.enabled',
    labelPosition: 'before',
  },
};

export const GithubOwnerField = {
  key: 'github_configuration.repository_owner_username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'person',
    label: 'setting.remote_repository.details.github.owner',
    hint: 'setting.remote_repository.details.github.owner_hint',
    maxLength: 1000,
    required: true,
  },
};

export const GithubRepositoryNameField = {
  key: 'github_configuration.repository_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'featured_video',
    label: 'setting.remote_repository.details.repository_name',
    hint: 'setting.remote_repository.details.github.repository_name_hint',
    maxLength: 1000,
    required: true,
  },
};

export const GithubBranchNameField: FormlyFieldConfig = {
  key: 'github_configuration.repository_branch_name',
  type: FormlyComponents.ICON_INPUT,
  defaultValue: 'main',
  hooks: {
    onInit: (field: FormlyFieldConfig | undefined) => {
      if (!field) return;
      const control = field.formControl;
      if (!control?.value?.trim()) {
        control?.setValue('main', { emitEvent: false });
      }
    },
  },
  templateOptions: {
    icon: 'branch',
    label: 'setting.remote_repository.details.repository_branch',
    hint: 'setting.remote_repository.details.github.repository_branch_hint',
    maxLength: 1000,
    required: true,
  },
};

export const GithubPersonalAccessTokenEmailField = {
  key: 'github_configuration.personal_access_token_email',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'email',
    label:
      'setting.remote_repository.details.github.personal_access_token_email',
    hint: 'setting.remote_repository.details.github.personal_access_token_email_hint',
    maxLength: 1000,
    required: true,
  },
  validators: {
    validation: [FormlyValidators.EmailFormat],
  },
};

export const GithubPersonalAccessTokenCommitterNameField = {
  key: 'github_configuration.personal_access_token_committer_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'person',
    label:
      'setting.remote_repository.details.github.personal_access_token_committer_name',
    hint: 'setting.remote_repository.details.github.personal_access_token_committer_name_hint',
    maxLength: 1000,
    required: true,
  },
};

export const GithubPersonalAccessTokenField = {
  key: 'github_configuration.personal_access_token',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    alwaysHint: true,
    type: 'password',
    icon: 'vpn_key',
    label: 'setting.remote_repository.details.personal_access_token',
    hint: 'setting.remote_repository.details.github.personal_access_token_hint',
    maxLength: 1000,
    required: true,
  },
};

export const AzureOrganizationNameField = {
  key: 'azure_devops_configuration.organization_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'organisms',
    label: 'setting.remote_repository.details.azure_devops.organization',
    hint: 'setting.remote_repository.details.azure_devops.organization_hint',
    maxLength: 1000,
    required: true,
  },
};

export const AzureProjectNameField = {
  key: 'azure_devops_configuration.project_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'application',
    label: 'setting.remote_repository.details.azure_devops.project',
    hint: 'setting.remote_repository.details.azure_devops.project_hint',
    maxLength: 1000,
    required: true,
  },
};

export const AzureRepositoryNameField = {
  key: 'azure_devops_configuration.repo_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'featured_video',
    label: 'setting.remote_repository.details.repository_name',
    hint: 'setting.remote_repository.details.azure_devops.repository_name_hint',
    maxLength: 1000,
    required: true,
  },
};

export const AzureBranchNameField = {
  key: 'azure_devops_configuration.branch_name',
  type: FormlyComponents.ICON_INPUT,
  defaultValue: 'main',
  hooks: {
    onInit: (field: FormlyFieldConfig | undefined) => {
      if (!field) return;
      const control = field.formControl;
      if (!control?.value?.trim()) {
        control?.setValue('main', { emitEvent: false });
      }
    },
  },
  templateOptions: {
    icon: 'branch',
    label: 'setting.remote_repository.details.repository_branch',
    hint: 'setting.remote_repository.details.github.repository_branch_hint',
    maxLength: 1000,
    required: true,
  },
};

export const AzurePersonalAccessTokenField = {
  key: 'azure_devops_configuration.personal_access_token',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    alwaysHint: true,
    type: 'password',
    icon: 'vpn_key',
    label: 'setting.remote_repository.details.personal_access_token',
    hint: 'setting.remote_repository.details.azure_devops.personal_access_token_hint',
    maxLength: 1000,
    required: true,
  },
};
