import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatorService } from '@core/translator/translator.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '@common/services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { SwitchersService } from '@core/switchers/switchers.service';
import { Router } from '@angular/router';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { SessionService } from '@services/session.service';
import { MatDialog } from '@angular/material/dialog';
import { AgreementComponent } from '@routes/pages/login/eula/agreement/agreement.component';
import { NotificationService } from '@services/notification.service';
import { SummaryService } from '@services/summary.service';
import { SystemSummary } from '@common/types';
import { PathConstant } from '@common/constants/path.constant';
import { HttpHeaders } from '@angular/common/http';
import { CommonHttpService } from '@common/api/common-http.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;
  public inProgress: boolean = false;
  public authMsg: string = '';
  public servers: Array<any> = [];
  public showPassword: boolean = false;
  public isFromSSO: boolean = false;
  public samlEnabled: boolean = false;
  public oidcEnabled: boolean = false;
  public app: any;
  public isEulaAccepted: boolean = true;
  public isEulaValid: boolean = true;
  public validEula: boolean = true;
  private version: string = '';
  private gpuEnabled: boolean = false;
  private originalUrl: string = '';
  private now!: Date;
  private currUrl: string = '';
  private w: any;
  private _dialogSubscription;

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private sessionService: SessionService,
    private authService: AuthService,
    private switchersService: SwitchersService,
    private cookieService: CookieService,
    private translatorService: TranslatorService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private commonHttpService: CommonHttpService,
    private summaryService: SummaryService,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.loginForm = fb.group({
      username: [null, Validators.required],
      password: [null, Validators.required],
    });
    this.w = GlobalVariable.window;
  }

  ngOnInit() {
    this.inProgress = false;
    this.samlEnabled = false;
    this.oidcEnabled = false;
    this.now = new Date();
    this.app = this.switchersService.getAppSwitcher('');
    this.localStorage.set('login_time', this.now.toString());
    this.originalUrl = this.localStorage.get(
      GlobalConstant.SESSION_STORAGE_ORIGINAL_URL
    );
    this.version = this.localStorage.get('version');
    this.gpuEnabled = this.localStorage.get('_gpuEnabled');
    this.currUrl = this.w.location.href;
    GlobalVariable.hasInitializedSummary = false;
    GlobalVariable.clusterName = '';
    if (this.sessionStorage.has('cluster')) {
      this.sessionStorage.remove('cluster');
    }
    if (this.currUrl.includes(GlobalConstant.PROXY_VALUE)) {
      this.isFromSSO = true;
      this.authService.getEula().subscribe(
        (eulaInfo: any) => {
          let eula = eulaInfo.eula;
          if (eula && eula.accepted) {
            this.isEulaAccepted = true;
            this.validEula = true;
            this.localLogin();
          } else {
            this.isEulaAccepted = false;
            this.validEula = false;
            const dialog = this.dialog.open(AgreementComponent, {
              data: { isFromSSO: true },
              width: '85vw',
              height: '90vh',
            });
            this._dialogSubscription = dialog.afterClosed().subscribe(() => {
              this.validEula = true;
              this.localLogin();
            });
          }
        },
        error => {
          this.cookieService.delete('temp');
          this.isEulaAccepted = false;
          this.notificationService.openError(
            error,
            this.translate.instant('license.message.GET_EULA_ERR')
          );
        }
      );
    } else {
      this.getAuthServer();
      this.verifyAuth();
      this.verifyEula();
    }
  }

  ngOnDestroy(): void {
    if (this._dialogSubscription) {
      this._dialogSubscription.unsubscribe();
    }
  }

  oktaLogin(value: any) {
    this.clearToken();
    this.inProgress = true;
    this.authService.samlLogin(value.username, value.password).subscribe(
      (saml: any) => {
        let redirect = saml.redirect;
        this.w.location.href = redirect.redirect_url;
      },
      error => {
        this.authMsg = error.status === 0 ? error.message : error.error;
        this.inProgress = false;
      }
    );
  }

  oidcLogin(value: any) {
    this.clearToken();
    this.inProgress = true;
    this.authService.openIdLogin(value.username, value.password).subscribe(
      (openId: any) => {
        let redirect = openId.redirect;
        this.w.location.href = redirect.redirect_url;
      },
      error => {
        this.authMsg = error.status === 0 ? error.message : error.error;
        this.inProgress = false;
      }
    );
  }

  localLogin(value?: any) {
    if (this.validEula) {
      this.authMsg = '';
      this.inProgress = true;
      this.authService
        .login(value?.username || '', value?.password || '')
        .subscribe(
          (userInfo: any) => {
            GlobalVariable.user = userInfo;
            GlobalVariable.nvToken = userInfo.token.token;
            GlobalVariable.isSUSESSO = userInfo.is_suse_authenticated;
            GlobalVariable.user.global_permissions =
              userInfo.token.global_permissions;
            GlobalVariable.user.domain_permissions =
              userInfo.token.domain_permissions;
            this.translatorService.useLanguage(
              GlobalVariable.user.token.locale
            );
            this.sessionStorage.set(
              GlobalConstant.SESSION_STORAGE_TOKEN,
              GlobalVariable.user
            );

            if (this.isEulaAccepted) {
              this.getSummary(userInfo);
            } else {
              this.authService.updateEula().subscribe(
                () => {
                  this.getSummary(userInfo);
                },
                error => {
                  this.authMsg = error.message;
                  this.inProgress = false;
                }
              );
            }
          },
          error => {
            this.authMsg = error.status === 0 ? error.message : error.error;
            this.inProgress = false;
          }
        );
    } else {
      this.authMsg = this.translate.instant('license.message.ACCEPT_EULA_ERR');
      this.inProgress = false;
    }
  }

  submitForm($ev, value: any, mode) {
    switch (mode) {
      case 'oidc':
        this.oidcLogin(value);
        break;
      case 'okta':
        this.oktaLogin(value);
        break;
      default:
        this.localLogin(value);
    }
  }

  private clearToken() {
    this.localStorage.clear();
    this.sessionService.clearSession();
    GlobalVariable.user = null;
    GlobalVariable.sidebarDone = false;
    GlobalVariable.versionDone = false;
    GlobalVariable.isFooterReady = false;
  }

  //get saml and openID status
  private getAuthServer() {
    this.authService.getTokenAuthServer().subscribe(
      (serverData: any) => {
        this.servers = serverData.servers;
        if (this.servers && this.servers.length > 0) {
          this.samlEnabled = this.servers.some(server => {
            return server.server_type === 'saml';
          });
          this.oidcEnabled = this.servers.some(server => {
            return server.server_type === 'oidc';
          });
        }
      },
      error => {
        this.authMsg = error.status === 0 ? error.message : error.error;
      },
      () => {
        if (this.sessionStorage.has(GlobalConstant.SESSION_STORAGE_TIMEOUT)) {
          console.log(
            'SESSION_STORAGE_TIMEOUT',
            this.sessionStorage.get(GlobalConstant.SESSION_STORAGE_TIMEOUT)
          );
          if (this.sessionStorage.get(GlobalConstant.SESSION_STORAGE_TIMEOUT)) {
            this.authMsg = 'Session has expired. Please login.'; //this.translate.instant("login.SESSION_TIMEOUT");
          }
        }
        this.clearToken();
      }
    );
  }

  //for saml and openID redirection
  private verifyAuth() {
    let hasAuthCookies = this.cookieService.check('temp');
    if (hasAuthCookies) {
      this.authService.updateTokenAuthServer().subscribe(
        (userInfo: any) => {
          this.inProgress = true;
          this.setUserInfo(userInfo);
          this.cookieService.delete('temp');
          if (this.isEulaAccepted) {
            this.getSummary(userInfo);
          } else {
            this.authService.updateEula().subscribe(
              () => {
                this.getSummary(userInfo);
              },
              error => {
                this.authMsg = error.message;
                this.inProgress = false;
              }
            );
          }
        },
        error => {
          this.inProgress = true;
          this.authMsg = error.status === 0 ? error.message : error.error;
          this.cookieService.delete('temp');
        }
      );
    }
  }

  public getEulaStatus(isChecked: boolean) {
    this.validEula = this.isEulaAccepted || isChecked;
  }

  private verifyEula() {
    this.authService.getEula().subscribe(
      (eulaInfo: any) => {
        let eula = eulaInfo.eula;
        if (eula && eula.accepted) {
          this.isEulaAccepted = true;
        }else{
          this.isEulaAccepted = false;
        }
        this.validEula = this.isEulaAccepted;
      },
      error => {
        this.cookieService.delete('temp');
        this.isEulaAccepted = false;
        this.validEula = this.isEulaAccepted;
        this.notificationService.openError(
          error,
          this.translate.instant('license.message.GET_EULA_ERR')
        );
      }
    );
  }

  private getSum(authToken) {
    const headers = new HttpHeaders()
      .set(GlobalConstant.SESSION_STORAGE_TOKEN, authToken)
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache');
    return GlobalVariable.http
      .get<SystemSummary>(PathConstant.DASHBOARD_SUMMARY_URL, {
        headers: headers,
      })
      .pipe();
  }

  private getSummary(userInfo) {
    this.getSum(userInfo.token.token).subscribe({
      next: summaryInfo => {
        GlobalVariable.isOpenShift =
          summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
          summaryInfo.summary.platform === GlobalConstant.RANCHER;
        GlobalVariable.summary = summaryInfo.summary;

        GlobalVariable.hasInitializedSummary = true;
        this.setUserInfo(userInfo);
        if (this.originalUrl && !this.originalUrl.includes('login')) {
          this.router.navigate([this.originalUrl]);
        } else {
          this.router.navigate([GlobalConstant.PATH_DEFAULT]);
        }
      },
      error: () => {
        this.inProgress = true;
        this.cookieService.delete('temp');
      },
    });
  }

  private setUserInfo(userInfo) {
    GlobalVariable.user = userInfo;
    GlobalVariable.user.global_permissions = userInfo.token.global_permissions;
    GlobalVariable.user.domain_permissions = userInfo.token.domain_permissions;
    this.translatorService.useLanguage(GlobalVariable.user.token.locale);
    this.sessionStorage.set(GlobalConstant.SESSION_STORAGE_TOKEN, userInfo);
  }
}
