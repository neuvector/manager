import { Inject, Injectable, SecurityContext } from '@angular/core';
import { PathConstant } from '../constants/path.constant';
import { Router } from '@angular/router';
import {
  SESSION_STORAGE,
  LOCAL_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { GlobalConstant } from '../constants/global.constant';
import { GlobalVariable } from '../variables/global.variable';
import { CommonHttpService } from '@common/api/common-http.service';
import { Subject } from 'rxjs';
import { AuthHttpService } from '@common/api/auth-http.service';

@Injectable()
export class AuthService {
  private _environmentVariablesRetrieved = new Subject();
  public onEnvironmentVariablesRetrieved$ =
    this._environmentVariablesRetrieved.asObservable();

  private _loginEvent = new Subject();
  public onLoginEvent$ = this._loginEvent.asObservable();
  private _logoutEvent = new Subject();
  public onLogoutEvent$ = this._logoutEvent.asObservable();

  constructor(
    private commonHttpService: CommonHttpService,
    private authHttpService: AuthHttpService,
    private router: Router,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService
  ) {}

  getTokenAuthServer() {
    return GlobalVariable.http.get(PathConstant.TOKEN_AUTH).pipe();
  }

  updateTokenAuthServer() {
    return GlobalVariable.http
      .patch(PathConstant.TOKEN_AUTH, { withCredentials: true })
      .pipe();
  }

  getEula() {
    return GlobalVariable.http.get(PathConstant.EULA_URL).pipe();
  }

  updateEula() {
    return GlobalVariable.http
      .post(PathConstant.EULA_URL, { accepted: true })
      .pipe();
  }

  getSummary() {
    return this.commonHttpService.getSummary();
  }

  samlLogin(username: string, password: string) {
    return GlobalVariable.http
      .get(PathConstant.TOKEN_AUTH, {
        params: { serverName: 'saml1' },
        withCredentials: true,
      })
      .pipe();
  }

  openIdLogin(username: string, password: string) {
    return GlobalVariable.http
      .get(PathConstant.OIDC_AUTH, {
        params: { serverName: 'openId1' },
        withCredentials: true,
      })
      .pipe();
  }

  login(payload: {
    username: string;
    password: string;
    new_password?: string;
    isRancherSSOUrl: boolean;
  }) {
    return GlobalVariable.http.post(PathConstant.LOGIN_URL, payload).pipe();
  }

  refreshToken(isRancherSSOUrl: boolean) {
    return GlobalVariable.http
      .get(PathConstant.SELF_URL, {
        params: { isOnNV: 'true', isRancherSSOUrl: isRancherSSOUrl },
      })
      .pipe();
  }

  logout(isNVTimeout: boolean, isSSOTimeout: boolean) {
    if (GlobalVariable.isSUSESSO && !isNVTimeout && !isSSOTimeout)
      this.router.navigate(['login']);
    else {
      this.authHttpService.getSamlSLOServer().subscribe({
        next: saml => {
          if (saml) {
            this.doLogout(isNVTimeout, saml.redirect_url);
          } else {
            this.doLogout(isNVTimeout, '');
          }
        },
        error: error => {
          this.doLogout(isNVTimeout, '');
        },
      });
    }
  }

  timeout(currUrl: string) {
    let temp4TimeoutFlag = null;
    if (this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TIMEOUT)) {
      temp4TimeoutFlag = this.localStorage.get(
        GlobalConstant.LOCAL_STORAGE_TIMEOUT
      );
    }
    this.clearLocalStorage();
    if (currUrl !== GlobalConstant.PATH_LOGIN) {
      this.localStorage.set(GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL, currUrl);
    }
    if (temp4TimeoutFlag) {
      this.localStorage.set(
        GlobalConstant.LOCAL_STORAGE_TIMEOUT,
        temp4TimeoutFlag
      );
    }
    this.router.navigate([GlobalConstant.PATH_LOGIN]);
  }

  clearLocalStorage() {
    let theme = this.localStorage.has(GlobalConstant.LOCAL_STORAGE_THEME)
      ? this.localStorage.get(GlobalConstant.LOCAL_STORAGE_THEME) === 'A' ||
        this.localStorage.get(GlobalConstant.LOCAL_STORAGE_THEME) === 'B'
        ? this.localStorage.get(GlobalConstant.LOCAL_STORAGE_THEME)
        : 'A'
      : 'A';
    this.localStorage.clear();
    this.localStorage.set(GlobalConstant.LOCAL_STORAGE_THEME, theme);
  }

  heartbeat() {
    return GlobalVariable.http.patch(PathConstant.HEART_BEAT_URL, '').pipe();
  }

  notifyEnvironmentVariablesRetrieved(): void {
    this._environmentVariablesRetrieved.next(true);
  }

  dispatchLoginEvent() {
    this._loginEvent.next(true);
  }

  dispatchLogoutEvent() {
    this._logoutEvent.next(true);
  }

  private doLogout = (isNVTimeout: boolean, redirectUrl: string) => {
    GlobalVariable.http.delete(PathConstant.LOGIN_URL).subscribe(
      (response: any) => {
        setTimeout(() => {
          let version = this.localStorage.get('version');
          let gpuEnabled = this.localStorage.get('_gpuEnabled');
          if (!isNVTimeout && !GlobalVariable.isSUSESSO) {
            this.localStorage.clear();
            GlobalVariable.user = null;
            GlobalVariable.sidebarDone = false;
            GlobalVariable.versionDone = false;
            GlobalVariable.isFooterReady = false;
            this.localStorage.set('version', version);
            this.localStorage.set('_gpuEnabled', gpuEnabled);
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else {
              this.router.navigate([GlobalConstant.PATH_LOGIN]);
            }
          } else {
            this.rejectBack();
          }
        }, 1000);
      },
      error => {
        this.rejectBack();
      }
    );
  };

  private rejectBack = () => {
    if (GlobalVariable.isSUSESSO) {
      this.router.navigate(['logout']);
    } else {
      this.router.navigate([GlobalConstant.PATH_LOGIN]);
    }
  };
}
