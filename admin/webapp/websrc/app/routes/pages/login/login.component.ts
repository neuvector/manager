import {
  Component,
  Inject,
  Injectable,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: UntypedFormGroup;
  public inProgress: boolean = false;
  public authMsg: string = '';
  public servers: Array<any> = [];
  public showPassword: boolean = false;
  public isFromSSO: boolean = false;
  public samlEnabled: boolean = false;
  public oidcEnabled: boolean = false;
  public app: any;
  public isEulaAccepted: boolean = false;
  public isEulaValid: boolean = true;
  public validEula: boolean = false;
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
    private fb: UntypedFormBuilder,
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
            const dialog = this.dialog.open(AgreementComponent, {
              data: { isFromSSO: true },
              width: '85vw',
              height: '90vh',
            });
            this._dialogSubscription = dialog
              .afterClosed()
              .subscribe(dialogData => {
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

  oktaLogin(value: any, mode) {
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

  oidcLogin(value: any, mode) {
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
              this.getSummary();
            } else {
              this.authService.updateEula().subscribe(
                value1 => {
                  this.getSummary();
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
        this.oidcLogin(value, mode);
        break;
      case 'okta':
        this.oktaLogin(value, mode);
        break;
      default:
        this.localLogin(value);
    }

    // for (let c in this.loginForm.controls) {
    //     this.loginForm.controls[c].markAsTouched();
    // }
    // if (this.loginForm.valid) {
    //     console.log('Valid!');
    //     console.log(value);
    // }
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
          GlobalVariable.user = userInfo;
          GlobalVariable.user.global_permissions =
            userInfo.token.global_permissions;
          GlobalVariable.user.domain_permissions =
            userInfo.token.domain_permissions;
          this.translatorService.useLanguage(GlobalVariable.user.token.locale);
          this.sessionStorage.set(
            GlobalConstant.SESSION_STORAGE_TOKEN,
            GlobalVariable.user
          );
          this.cookieService.delete('temp');
          if (this.isEulaAccepted) {
            this.getSummary();
          } else {
            this.authService.updateEula().subscribe(
              value1 => {
                this.getSummary();
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
        }
        this.validEula = this.isEulaAccepted;
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
  }

  private getSummary() {
    this.authService.getSummary().subscribe(
      (summaryInfo: any) => {
        GlobalVariable.isOpenShift =
          summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
          summaryInfo.summary.platform === GlobalConstant.RANCHER;
        GlobalVariable.summary = summaryInfo.summary;
        GlobalVariable.hasInitializedSummary = true;

        if (this.originalUrl && !this.originalUrl.includes('login')) {
          this.router.navigate([this.originalUrl]);
        } else {
          this.router.navigate([GlobalConstant.PATH_DEFAULT]);
        }
      },
      error => {
        this.inProgress = true;
        this.cookieService.delete('temp');
      }
    );
  }
}
