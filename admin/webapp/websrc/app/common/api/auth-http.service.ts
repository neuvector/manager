import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import {
  LicenseGetResponse,
  PasswordProfile,
  PermissionOptionResponse,
  RenewLicensePostBody,
  Role,
  Self,
  SelfGetResponse,
  ServerGetResponse,
  ServerPatchBody,
  User,
  UserGetResponse,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

@Injectable()
export class AuthHttpService {
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

  getPermissionOptions(): Observable<PermissionOptionResponse> {
    return GlobalVariable.http
      .get<PermissionOptionResponse>(PathConstant.PERMISSION_OPTIONS)
      .pipe(pluck('options'));
  }

  getPwdProfile(): Observable<PasswordProfile> {
    return GlobalVariable.http
      .get<{ pwd_profiles: PasswordProfile[] }>(PathConstant.PASSWORD_PROFILE)
      .pipe(map(pwdProfileResponse => pwdProfileResponse.pwd_profiles[0]));
  }

  patchPwdProfile(profile: PasswordProfile): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.PASSWORD_PROFILE, {
      config: profile,
    });
  }
}
