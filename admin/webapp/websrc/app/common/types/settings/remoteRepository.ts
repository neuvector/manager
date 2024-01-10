export interface RemoteRepository {
  nickname: string;
  provider: string;
  comment: string;
  github_configuration: GithubConfiguration;
}

export interface GithubConfiguration {
  repository_owner_username: string;
  repository_name: string;
  repository_branch_name: string;
  personal_access_token_email: string;
  personal_access_token_committer_name: string;
  personal_access_token?: string;
}

export interface RemoteRepositoryWrapper {
  config: RemoteRepository;
}
