import {
  FormlyComponents,
  FormlyValidators,
} from '@common/neuvector-formly/neuvector-formly.module';

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
  type: FormlyComponents.ICON_INPUT,
  defaultValue: 'github',
  expressionProperties: {
    'templateOptions.disabled': () => true,
  },
  templateOptions: {
    icon: 'workspaces',
    hint: 'setting.remote_repository.details.provider_hint',
    label: 'setting.remote_repository.details.provider',
    maxLength: 1000,
    required: true,
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

export const RepositoryOwnerField = {
  key: 'github_configuration.repository_owner_username',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'person',
    label: 'setting.remote_repository.details.owner',
    hint: 'setting.remote_repository.details.owner_hint',
    maxLength: 1000,
    required: true,
  },
};

export const RepositoryNameField = {
  key: 'github_configuration.repository_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'featured_video',
    label: 'setting.remote_repository.details.repository_name',
    hint: 'setting.remote_repository.details.repository_name_hint',
    maxLength: 1000,
    required: true,
  },
};

export const RepositoryBranchNameField = {
  key: 'github_configuration.repository_branch_name',
  type: FormlyComponents.ICON_INPUT,
  defaultValue: 'main',
  templateOptions: {
    icon: 'storage',
    label: 'setting.remote_repository.details.repository_branch',
    hint: 'setting.remote_repository.details.repository_branch_hint',
    maxLength: 1000,
  },
};

export const PersonalAccessTokenEmailField = {
  key: 'github_configuration.personal_access_token_email',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'email',
    label: 'setting.remote_repository.details.personal_access_token_email',
    hint: 'setting.remote_repository.details.personal_access_token_email_hint',
    maxLength: 1000,
  },
  validators: {
    validation: [FormlyValidators.EmailFormat],
  },
};

export const PersonalAccessTokenCommitterNameField = {
  key: 'github_configuration.personal_access_token_committer_name',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    icon: 'person',
    label:
      'setting.remote_repository.details.personal_access_token_committer_name',
    hint: 'setting.remote_repository.details.personal_access_token_committer_name_hint',
    maxLength: 1000,
  },
};

export const PersonalAccessTokenField = {
  key: 'github_configuration.personal_access_token',
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    alwaysHint: true,
    type: 'password',
    icon: 'vpn_key',
    label: 'setting.remote_repository.details.personal_access_token',
    hint: 'setting.remote_repository.details.personal_access_token_hint',
    maxLength: 1000,
    required: true,
  },
};
