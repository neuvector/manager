import { Component, HostBinding, OnInit, Inject, HostListener } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslatorService } from '@core/translator/translator.service';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { SwitchersService } from '@core/switchers/switchers.service';
import { AuthService } from '@common/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private win: any;
  isFirstAction: boolean;
  isSummaryDone: boolean = false;
  initTimer: number;

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    public switchers: SwitchersService,
    private translatorService: TranslatorService,
    private authService: AuthService
  ) {
    this.win = GlobalVariable.window;
    this.initTimer = new Date().getTime();
    this.isFirstAction = true;
  }

  @HostBinding('class.layout-fixed') get isFixed() {
    return this.switchers.getFrameSwitcher('isFixed');
  }

  @HostBinding('class.left-side-collapsed') get isCollapsed() {
    return this.switchers.getFrameSwitcher('isCollapsed');
  }

  @HostBinding('class.layout-boxed') get isBoxed() {
    return this.switchers.getFrameSwitcher('isBoxed');
  }

  @HostBinding('class.layout-fs') get useFullLayout() {
    return this.switchers.getFrameSwitcher('useFullLayout');
  }

  @HostBinding('class.hidden-footer') get hiddenFooter() {
    return this.switchers.getFrameSwitcher('hiddenFooter');
  }

  @HostBinding('class.layout-h') get horizontal() {
    return this.switchers.getFrameSwitcher('horizontal');
  }

  @HostBinding('class.left-side-float') get isFloat() {
    return this.switchers.getFrameSwitcher('isFloat');
  }

  @HostBinding('class.offsidebar-open') get offsidebarOpen() {
    return this.switchers.getFrameSwitcher('offsidebarOpen');
  }

  @HostBinding('class.left-side-toggled') get leftSideToggled() {
    return this.switchers.getFrameSwitcher('leftSideToggled');
  }

  @HostBinding('class.left-side-collapsed-text') get isCollapsedText() {
    return this.switchers.getFrameSwitcher('isCollapsedText');
  }

  ngOnInit() {
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' &&
        ['', '#'].indexOf(target.getAttribute('href') || '') > -1
      )
        e.preventDefault();
    });
    if (this.win.location.hash !== '#/login' && this.win.location.hash !== '') {
      this.authService.refreshToken().subscribe(
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
          if (!GlobalVariable.hasInitializedSummary) {
            this.authService.getSummary().subscribe((summaryInfo: any) => {
              GlobalVariable.isOpenShift =
                summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
                summaryInfo.summary.platform === GlobalConstant.RANCHER;
              GlobalVariable.summary = summaryInfo.summary;
              GlobalVariable.hasInitializedSummary = true;
              this.isSummaryDone = true;
            });
          }
        },
        error => {
          location.reload();
        }
      );
    } else {
      this.isSummaryDone = true;
    }
  }

  @HostListener('mousedown')
  @HostListener('wheel')
  heartbeatWithDebounce = () => {
    return this.debounced(200, this.heartbeat)();
  };

  private debounced = (delay, fn) => {
    let timerId;
    let timeout;
    return function (...args) {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        fn(...args);
        if (GlobalVariable.user) {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            fn(...args);
          },GlobalVariable.user.token.timeout * 1000 + 10000);
        }
        timerId = null;
      }, delay);
    }
  };

  private heartbeat = () => {
    let currTimer: number = new Date().getTime();
    if (this.win.location.hash !== '#/login') {
      if (currTimer - this.initTimer > 29000 || this.isFirstAction) {
        this.isFirstAction = false;
        this.initTimer = currTimer;
        this.authService.heartbeat()
          .subscribe(
            response => {console.log("heartbeat...OK");},
            error => {console.log("heartbeat...NG");}
          );
      }
    }
  }

}
