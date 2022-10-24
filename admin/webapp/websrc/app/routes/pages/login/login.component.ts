import { Component, Inject, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatorService } from '@core/translator/translator.service';
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

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public loginForm: FormGroup;
  public inProgress: boolean;
  public authMsg: string;
  public servers: Array<any>;
  public showPassword: boolean;
  public isFromSSO: boolean;
  public samlEnabled: boolean;
  public oidcEnabled: boolean;
  public app: any;
  private version: string;
  private gpuEnabled: boolean;
  private originalUrl: string;
  private now: Date;
  private currUrl: string;
  private w: any;

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private authService: AuthService,
    private switchersService: SwitchersService,
    private cookieService: CookieService,
    private translatorService: TranslatorService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = fb.group({
      username: [null, Validators.required],
      password: [null, Validators.required],
    });
    this.w = GlobalVariable.window;
  }

  ngOnInit() {
    console.log('Initialize Login......');
    this.inProgress = false;
    this.samlEnabled = false;
    this.oidcEnabled = false;
    this.now = new Date();
    this.app = this.switchersService.getAppSwitcher('');
    this.localStorage.set('login_time', this.now.toString());
    this.originalUrl = this.localStorage.get(GlobalConstant.SESSION_STORAGE_ORIGINAL_URL);
    this.version = this.localStorage.get('version');
    this.gpuEnabled = this.localStorage.get('_gpuEnabled');
    this.currUrl = this.w.location.href;
    GlobalVariable.hasInitializedSummary = false;
    GlobalVariable.clusterName = '';
    if (this.sessionStorage.has('cluster')) {
      this.sessionStorage.remove('cluster');
    }
    this.clearToken();
    console.log("this.currUrl", this.currUrl);
    if (this.currUrl.includes(GlobalConstant.PROXY_VALUE)) {
      this.isFromSSO = true;
      console.log('It is from SSO');
      this.localLogin();
    }
    this.getAuthServer();
    this.verifyAuth();
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
        this.authMsg = error.message;
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
        this.authMsg = error.message;
        this.inProgress = false;
      }
    );
  }

  localLogin(value?: any) {
    this.authMsg = '';
    this.inProgress = true;
    this.authService.login(
      value?.username || '',
      value?.password || ''
    ).subscribe(
      (userInfo: any) => {
        GlobalVariable.user = userInfo;
        GlobalVariable.nvToken = userInfo.token.token;
        GlobalVariable.isSUSESSO = userInfo.is_suse_authenticated;
        GlobalVariable.user.global_permissions =
          userInfo.token.global_permissions;
        GlobalVariable.user.domain_permissions =
          userInfo.token.domain_permissions;
        this.translatorService.useLanguage(GlobalVariable.user.token.locale);
        this.sessionStorage.set(
          GlobalConstant.SESSION_STORAGE_TOKEN,
          GlobalVariable.user
        );
        this.verifyEula(true);
        // if (
        //   this.sessionStorage.has(GlobalConstant.SESSION_STORAGE_ORIGINAL_URL)
        // ) {
        //   this.router.navigate([
        //     this.sessionStorage.get(
        //       GlobalConstant.SESSION_STORAGE_ORIGINAL_URL
        //     ),
        //   ]);
        // } else {
        //   this.router.navigate([GlobalConstant.PATH_DEFAULT]);
        // }
        this.inProgress = false;
      },
      error => {
        this.authMsg = error.message;
        this.inProgress = false;
      }
    );
  }

  submitForm($ev, value: any, mode) {
    switch (mode) {
      case 'oidc':
        this.oidcLogin(value, mode);
        break;
      case 'okta':
        this.oidcLogin(value, mode);
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
    this.sessionStorage.clear();
    GlobalVariable.user = null;
    GlobalVariable.sidebarDone = false;
    GlobalVariable.versionDone = false;
    GlobalVariable.isFooterReady = false;
  }

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
        this.authMsg = error.message;
      }
    );
  }

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
          if (this.sessionStorage.has(GlobalConstant.SESSION_STORAGE_TOKEN)) {
            GlobalVariable.headers.set(
              'Token',
              this.sessionStorage.get(GlobalConstant.SESSION_STORAGE_TOKEN)
                .token.token
            );
          }
          this.cookieService.delete('temp');
          this.verifyEula(false);
        },
        error => {
          this.inProgress = true;
          this.authMsg = error.message;
          this.cookieService.delete('temp');
        }
      );
    }
  }

  private verifyEula(isFromLocalAuth: boolean) {
    this.authService.getEula().subscribe(
      (eulaInfo: any) => {
        let eula = eulaInfo.eula;
        GlobalVariable.isOpenShift = false;
        this.getSummary(eula, isFromLocalAuth);
      },
      error => {
        this.inProgress = true;
        this.cookieService.delete('temp');
      }
    );
  }

  private getSummary(eula: any, isFromLocalAuth: boolean) {
    this.authService.getSummary().subscribe(
      (summaryInfo: any) => {
        GlobalVariable.isOpenShift =
          summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
          summaryInfo.summary.platform === GlobalConstant.RANCHER;
        GlobalVariable.summary = summaryInfo.summary;
        GlobalVariable.hasInitializedSummary = true;
        if (eula === null) {
          // this.router.navigate(['eula']);
          // Without accept agreement, navigate to dashboard temporarily
          this.router.navigate(['dashboard']);
        } else {
          if (eula.accepted) {
            if (
              this.originalUrl &&
              this.originalUrl !== 'login' &&
              isFromLocalAuth
            ) {
              this.router.navigate([this.originalUrl]);
            } else {
              this.router.navigate(['dashboard']);
            }
          } else {
            // this.router.navigate(['eula']);
            // Without accept agreement, navigate to dashboard temporarily
            this.router.navigate(['dashboard']);
          }
        }
      },
      error => {
        this.inProgress = true;
        this.cookieService.delete('temp');
      }
    );
  }
}
