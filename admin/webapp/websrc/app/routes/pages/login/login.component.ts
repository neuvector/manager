import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { AgreementComponent } from '@routes/pages/login/eula/agreement/agreement.component';
import { NotificationService } from '@services/notification.service';
import { SummaryService } from '@services/summary.service';
import {
  ErrorResponse,
  PublicPasswordProfile,
  SystemSummary,
} from '@common/types';
import { PathConstant } from '@common/constants/path.constant';
import { HttpHeaders } from '@angular/common/http';
import { CommonHttpService } from '@common/api/common-http.service';
import { isValidBased64 } from '@common/utils/common.utils';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ResetPasswordModalComponent } from '@routes/settings/common/reset-password-modal/reset-password-modal.component';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AlertComponent } from '@routes/pages/login/alert/alert.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Cluster, ClusterData } from '@common/types';
import { MapConstant } from '@common/constants/map.constant';

interface ResetError extends ErrorResponse {
  password_profile_basic: PublicPasswordProfile;
}

@Component({
  standalone: false,
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
  public rbacAlertMessage: string = '';
  public bootstrapPasswordCommand: string = '';
  private version: string = '';
  private gpuEnabled: boolean = false;
  private originalUrl: string = '';
  private linkedUrl: string = '';
  private now!: Date;
  private currUrl: string = '';
  private w: any;
  private _dialogSubscription;
  private _getRebrandCustomValuesSubscription;
  private needsNewToken: boolean = true;
  public customLoginLogo: SafeHtml = '';
  public hasCustomHeader: boolean = false;
  public passwordReset = new Subject();

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
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
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private multiClusterService: MultiClusterService
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
      GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL
    );
    this.linkedUrl = this.localStorage.get(
      GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF
    );
    this.version = this.localStorage.get('version');
    this.gpuEnabled = this.localStorage.get('_gpuEnabled');
    this.currUrl = this.w.location.href;
    GlobalVariable.hasInitializedSummary = false;
    GlobalVariable.clusterName = '';

    if (this.currUrl.includes(GlobalConstant.PROXY_VALUE)) {
      this.isFromSSO = true;
    }

    if (GlobalVariable.customLoginLogo) {
      this.customLoginLogo = this.sanitizer.bypassSecurityTrustHtml(
        GlobalVariable.customLoginLogo
      );
    }

    if (!this.isFromSSO && GlobalVariable.customPolicy) {
      this.openEULAPage();
    }

    if (GlobalVariable.customPageHeaderColor) {
      this.hasCustomHeader = true;
    }

    if (
      !GlobalVariable.customLoginLogo &&
      !GlobalVariable.customPolicy &&
      !GlobalVariable.customPageHeaderColor
    ) {
      this.retrieveCustomizedUIContent();
    }

    //check if the saml/openID login button should be enabled
    this.getAuthServer();

    // If the user is already logged in, redirect to the dashboard page
    if (
      this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TOKEN) &&
      !(
        this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TIMEOUT) &&
        this.localStorage.get(GlobalConstant.LOCAL_STORAGE_TIMEOUT) === true
      )
    ) {
      try {
        const userInfo = this.localStorage.get(
          GlobalConstant.LOCAL_STORAGE_TOKEN
        );
        if (this.isFromSSO) {
          console.log('SSO go to token validation');
          this.needsNewToken = false;
          this.localLogin();
        } else {
          this.setUserInfo(userInfo);
          this.getSummary(userInfo);
        }
      } catch (e) {
        console.error('Local storage token error.', (e as Error).message);
        this.clearLocalStorage();
      }
    } else if (this.isFromSSO) {
      this.authService.getEula(this.isFromSSO).subscribe(
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
              disableClose: true,
              data: { showAcceptButton: true, showCustomPolicy: false },
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
            error.error,
            this.translate.instant('license.message.GET_EULA_ERR')
          );
        }
      );
    } else {
      if (this.cookieService.check('temp')) {
        this.verifyAuth();
      }
      this.verifyEula();
    }
  }

  ngOnDestroy(): void {
    if (this._dialogSubscription) {
      this._dialogSubscription.unsubscribe();
    }
    if (this._getRebrandCustomValuesSubscription) {
      this._getRebrandCustomValuesSubscription.unsubscribe();
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
      value = value
        ? Object.assign({ isRancherSSOUrl: this.isFromSSO }, value)
        : { username: '', password: '', isRancherSSOUrl: this.isFromSSO };
      const loginFn = this.needsNewToken
        ? this.authService.login(value)
        : this.authService.refreshToken(true);
      loginFn.subscribe(
        (userInfo: any) => {
          if (userInfo.need_to_reset_password) {
            this.openResetPassword(value);
          } else {
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
            this.localStorage.set(
              GlobalConstant.LOCAL_STORAGE_TOKEN,
              GlobalVariable.user
            );
            if (this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TIMEOUT)) {
              this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TIMEOUT);
            }

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
          }
        },
        error => {
          console.log(error);
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
    this.clearLocalStorage();
    GlobalVariable.user = null;
    GlobalVariable.sidebarDone = false;
    GlobalVariable.versionDone = false;
    GlobalVariable.isFooterReady = false;
  }

  private clearLocalStorage() {
    let externalRef = this.localStorage.get(
      GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF
    );
    let timeoutPath = this.localStorage.get(
      GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL
    );
    this.localStorage.clear();
    if (externalRef)
      this.localStorage.set(
        GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF,
        externalRef
      );
    if (timeoutPath)
      this.localStorage.set(
        GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL,
        timeoutPath
      );
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
        if (this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TIMEOUT)) {
          console.log(
            'LOCAL_STORAGE_TIMEOUT',
            this.localStorage.get(GlobalConstant.LOCAL_STORAGE_TIMEOUT)
          );
          if (this.localStorage.get(GlobalConstant.LOCAL_STORAGE_TIMEOUT)) {
            this.authMsg = 'Session has expired. Please login.'; //this.translate.instant("login.SESSION_TIMEOUT");
          }
        }
      }
    );
  }

  //for saml and openID redirection
  private verifyAuth() {
    this.authService.updateTokenAuthServer().subscribe(
      (userInfo: any) => {
        this.inProgress = true;
        this.setUserInfo(userInfo);
        if (this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TIMEOUT)) {
          this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TIMEOUT);
        }
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

  public getEulaStatus(isChecked: boolean) {
    this.validEula = this.isEulaAccepted || isChecked;
  }

  private verifyEula() {
    this.authService.getEula().subscribe(
      (eulaInfo: any) => {
        let eula = eulaInfo.eula;
        if (eulaInfo.k8s_rbac_alert_message) {
          this.rbacAlertMessage = eulaInfo.k8s_rbac_alert_message;
        }

        if (eulaInfo.bootstrap_password_command) {
          this.bootstrapPasswordCommand = eulaInfo.bootstrap_password_command;
        }

        if (eula && eula.accepted) {
          this.isEulaAccepted = true;
        } else {
          this.isEulaAccepted = false;
        }
        this.validEula = this.isEulaAccepted;
      },
      error => {
        this.cookieService.delete('temp');
        this.isEulaAccepted = false;
        this.validEula = this.isEulaAccepted;
        this.notificationService.openError(
          error.error,
          this.translate.instant('license.message.GET_EULA_ERR')
        );
      }
    );
  }

  private getSum(authToken) {
    const headers = new HttpHeaders()
      .set(GlobalConstant.LOCAL_STORAGE_TOKEN, authToken)
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache');
    return GlobalVariable.http
      .get<SystemSummary>(PathConstant.DASHBOARD_SUMMARY_URL, {
        headers: headers,
      })
      .pipe();
  }

  private getSummary(userInfo) {
    forkJoin({
      summaryInfo: this.getSum(userInfo.token.token),
      clusterData: this.multiClusterService.getClusters(),
    })
      .pipe(
        tap(({ summaryInfo, clusterData }) => {
          // Handle summaryInfo
          GlobalVariable.isOpenShift =
            summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
            summaryInfo.summary.platform === GlobalConstant.RANCHER;
          GlobalVariable.summary = summaryInfo.summary;

          // Handle clusterData
          if (clusterData) {
            GlobalVariable.isMaster =
              clusterData.fed_role === MapConstant.FED_ROLES.MASTER;
            GlobalVariable.isMember =
              clusterData.fed_role === MapConstant.FED_ROLES.MEMBER;
            GlobalVariable.isStandAlone = clusterData.fed_role === '';

            const sessionCluster = this.localStorage.get(
              GlobalConstant.LOCAL_STORAGE_CLUSTER
            );
            const clusterInSession = sessionCluster
              ? JSON.parse(sessionCluster)
              : null;
            GlobalVariable.isRemote = clusterInSession
              ? clusterInSession.isRemote
              : false;
          }

          GlobalVariable.hasInitializedSummary = true;

          // Navigate
          this.setUserInfo(userInfo);
          if (
            this.originalUrl &&
            !this.originalUrl.includes('login') &&
            !this.originalUrl.includes('logout')
          ) {
            this.router.navigate([this.originalUrl]);
          } else if (
            this.linkedUrl &&
            this.originalUrl &&
            !this.linkedUrl.includes('login') &&
            !this.linkedUrl.includes('logout')
          ) {
            this.nav2LinkedUrl(this.linkedUrl);
          } else {
            this.router.navigate([GlobalConstant.PATH_DEFAULT]);
          }

          this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF);
          this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL);
        }),
        catchError(err => {
          this.inProgress = false;
          this.cookieService.delete('temp');
          return of(); // empty observable to complete
        })
      )
      .subscribe();
  }

  private nav2LinkedUrl(url) {
    let trimedUrl = url.split('#')[1];
    let pathSec = trimedUrl.split('?');
    let refPath = pathSec[0];
    let querySec = pathSec[1] ? pathSec[1].split('&') : [];
    let query = {};
    querySec.forEach(item => {
      let itemSec = item.split('=');
      query[itemSec[0]] = itemSec[1];
    });

    console.log(refPath, query);
    this.router.navigate([refPath], { queryParams: query });
  }

  private setUserInfo(userInfo) {
    GlobalVariable.user = userInfo;
    GlobalVariable.nvToken = userInfo.token.token;
    GlobalVariable.isSUSESSO = userInfo.is_suse_authenticated;
    GlobalVariable.user.global_permissions = userInfo.token.global_permissions;
    GlobalVariable.user.domain_permissions = userInfo.token.domain_permissions;
    this.translatorService.useLanguage(GlobalVariable.user.token.locale);
    this.localStorage.set(GlobalConstant.LOCAL_STORAGE_TOKEN, userInfo);
  }

  // Retrieve customized UI content from environment variables (API endpoint is "/rebrand")
  // These variables allow customization of the login page logo, content of Policy (banner) and content of the page header
  private retrieveCustomizedUIContent() {
    this._getRebrandCustomValuesSubscription = this.commonHttpService
      .getRebrandCustomValues()
      .subscribe(value => {
        if (value.customLoginLogo) {
          GlobalVariable.customLoginLogo = isValidBased64(value.customLoginLogo)
            ? atob(value.customLoginLogo)
            : value.customLoginLogo;
          this.customLoginLogo = this.sanitizer.bypassSecurityTrustHtml(
            GlobalVariable.customLoginLogo
          );
        }

        if (value.customPolicy) {
          GlobalVariable.customPolicy = isValidBased64(value.customPolicy)
            ? atob(value.customPolicy)
            : value.customPolicy;

          if (!this.isFromSSO) {
            this.openEULAPage();
          }
        }

        if (value.customPageHeaderContent) {
          GlobalVariable.customPageHeaderContent = isValidBased64(
            value.customPageHeaderContent
          )
            ? atob(value.customPageHeaderContent)
            : value.customPageHeaderContent;
        }

        if (value.customPageHeaderColor) {
          GlobalVariable.customPageHeaderColor = isValidBased64(
            value.customPageHeaderColor
          )
            ? atob(value.customPageHeaderColor)
            : value.customPageHeaderColor;
        }

        if (value.customPageFooterContent) {
          GlobalVariable.customPageFooterContent = isValidBased64(
            value.customPageFooterContent
          )
            ? atob(value.customPageFooterContent)
            : value.customPageFooterContent;
        }

        if (value.customPageFooterColor) {
          GlobalVariable.customPageFooterColor = isValidBased64(
            value.customPageFooterColor
          )
            ? atob(value.customPageFooterColor)
            : value.customPageFooterColor;
        } else if (GlobalVariable.customPageHeaderColor) {
          GlobalVariable.customPageFooterColor =
            GlobalVariable.customPageHeaderColor;
        }

        this.authService.notifyEnvironmentVariablesRetrieved();
        this.hasCustomHeader = true;
      });
  }

  private openEULAPage() {
    const dialogRef = this.dialog.open(AgreementComponent, {
      autoFocus: false,
      disableClose: true,
      data: {
        showAcceptButton: true,
        showCustomPolicy: GlobalVariable.customPolicy ? true : false,
      },
      width: '80vw',
      height: '90vh',
    });
  }

  private openResetPassword(value?: any) {
    const dialogRef = this.dialog.open(ResetPasswordModalComponent, {
      disableClose: true,
      data: {
        username: value ? value.username : '',
        password: value ? value.password : '',
      },
      width: '80%',
      maxWidth: '1100px',
    });
    dialogRef.componentInstance.resetData.subscribe(payload => {
      this.authService
        .login(Object.assign({ isRancherSSOUrl: this.isFromSSO }, payload))
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
            this.localStorage.set(
              GlobalConstant.LOCAL_STORAGE_TOKEN,
              GlobalVariable.user
            );
            if (this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TIMEOUT)) {
              this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TIMEOUT);
            }

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
            dialogRef.componentInstance.onClose();
          },
          ({ error }) => {
            dialogRef.componentInstance.pwdProfile =
              error.password_profile_basic;
            dialogRef.componentInstance.resetError = error.message;
          }
        );
    });
    dialogRef.afterClosed().subscribe(() => {
      this.inProgress = false;
    });
  }

  public showAlertDetails() {
    const dialogRef = this.dialog.open(AlertComponent, {
      autoFocus: false,
      disableClose: true,
      data: {
        k8s_rbac_alert_message: this.rbacAlertMessage,
        bootstrap_password_command: this.bootstrapPasswordCommand,
      },
      width: '60vw',
      height: 'auto',
      maxHeight: '500px',
    });
  }
}
