import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import {
  Apikey,
  ApikeyGetResponse,
  ApikeyInit,
  LicenseGetResponse,
  PasswordProfile,
  PermissionOptionResponse,
  PublicPasswordProfile,
  RenewLicensePostBody,
  Role,
  Self,
  SelfGetResponse,
  ServerGetResponse,
  ServerPatchBody,
  SsoServer,
  User,
  UserGetResponse,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

@Injectable()
export class AuthHttpService {
  getSamlSLOServer(): Observable<SsoServer> {
    return GlobalVariable.http
      .get<SsoServer>(PathConstant.SAML_SLO_URL)
      .pipe(pluck('redirect'));
  }

  getLicense(): Observable<LicenseGetResponse> {
    return GlobalVariable.http
      .get<LicenseGetResponse>(PathConstant.LICENSE_URL)
      .pipe(pluck('license'));
  }

  postLicense(body: RenewLicensePostBody): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(
      PathConstant.LICENSE_LOAD_URL,
      body
    );
  }

  getUsers(): Observable<UserGetResponse> {
    return GlobalVariable.http.get<UserGetResponse>(PathConstant.USERS_URL);
  }

  addUser(
    user: Omit<
      User,
      'blocked_for_failed_login' | 'blocked_for_password_expired' | 'emailHash'
    >
  ): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.USERS_URL, user);
  }

  patchUser(user: User): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.USERS_URL, user);
  }

  unblockUser(userId: string): Observable<unknown> {
    const config = {
      fullname: userId,
      clear_failed_login: true,
    };
    return GlobalVariable.http.post<unknown>(PathConstant.USER_BLOCK_URL, {
      config,
    });
  }

  resetUser(config: {
    fullname: string;
    new_password: string;
  }): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.USER_BLOCK_URL, {
      config,
    });
  }

  deleteUser(userId: string): Observable<unknown> {
    return GlobalVariable.http.delete<unknown>(PathConstant.USERS_URL, {
      params: { userId },
    });
  }

  getRoles(): Observable<Role[]> {
    return GlobalVariable.http
      .get<Role[]>(PathConstant.ROLES)
      .pipe(pluck('roles'));
  }

  addRole(role: Role): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.ROLES, {
      config: role,
    });
  }

  patchRole(role: Role): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.ROLES, {
      config: role,
    });
  }

  deleteRole(name: string): Observable<unknown> {
    return GlobalVariable.http.delete<unknown>(PathConstant.ROLES, {
      params: { name },
    });
  }

  getApikeys(): Observable<ApikeyGetResponse> {
    return GlobalVariable.http.get<ApikeyGetResponse>(PathConstant.APIKEY_URL);
  }

  getApikey(name: string): Observable<Apikey> {
    return GlobalVariable.http
      .get<Apikey>(PathConstant.APIKEY_URL, {
        params: { name },
      })
      .pipe(pluck('apikey'));
  }

  postApikey(apikey: Apikey): Observable<ApikeyInit> {
    return GlobalVariable.http
      .post<ApikeyInit>(PathConstant.APIKEY_URL, {
        apikey,
      })
      .pipe(pluck('apikey'));
  }

  deleteApikey(name: string): Observable<unknown> {
    return GlobalVariable.http.delete<unknown>(PathConstant.APIKEY_URL, {
      params: { name },
    });
  }

  getSelf(): Observable<SelfGetResponse> {
    return GlobalVariable.http.get<SelfGetResponse>(PathConstant.SELF_URL, {
      params: { isOnNV: 'true' },
    });
  }

  patchSelf(user: Self): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.USERS_URL, user);
  }

  getServer(): Observable<ServerGetResponse> {
    return GlobalVariable.http.get<ServerGetResponse>(PathConstant.LDAP_URL);
  }

  patchServer(body: ServerPatchBody): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.LDAP_URL, body);
  }

  postServer(body: ServerPatchBody): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.LDAP_URL, body);
  }

  getPermissionOptions(): Observable<PermissionOptionResponse> {
    return GlobalVariable.http
      .get<PermissionOptionResponse>(PathConstant.PERMISSION_OPTIONS)
      .pipe(pluck('options'));
  }

  getPwdProfile(): Observable<PasswordProfile> {
    return GlobalVariable.http
      .get<{ pwd_profiles: PasswordProfile[]; active_profile_name: string }>(
        PathConstant.PASSWORD_PROFILE
      )
      .pipe(
        map(pwdProfileResponse => {
          const active_profile_name =
            pwdProfileResponse.active_profile_name || 'default';
          return pwdProfileResponse.pwd_profiles.filter(
            pwd_profile => pwd_profile.name === active_profile_name
          )[0];
        })
      );
  }

  getPublicPwdProfile(): Observable<PublicPasswordProfile> {
    return GlobalVariable.http
      .get<PublicPasswordProfile>(PathConstant.PUBLIC_PASSWORD_PROFILE)
      .pipe(pluck('pwd_profile'));
  }

  patchPwdProfile(profile: PasswordProfile): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.PASSWORD_PROFILE, {
      config: profile,
    });
  }
}
