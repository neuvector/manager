import {
  Component,
  HostBinding,
  OnInit,
  Inject,
  HostListener,
} from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslatorService } from '@core/translator/translator.service';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { SwitchersService } from '@core/switchers/switchers.service';
import { AuthService } from '@common/services/auth.service';
import { SummaryService } from '@services/summary.service';
import { CommonHttpService } from '@common/api/common-http.service';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Cluster, ClusterData } from '@common/types';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
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
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    public switchers: SwitchersService,
    private translatorService: TranslatorService,
    private summaryService: SummaryService,
    private authService: AuthService,
    private commonHttpService: CommonHttpService,
    private multiClusterService: MultiClusterService
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
    this.multiClusterService.getClusters().subscribe({
      next: (data: ClusterData) => {
        GlobalVariable.isMaster =
          data.fed_role === MapConstant.FED_ROLES.MASTER;
        GlobalVariable.isMember =
          data.fed_role === MapConstant.FED_ROLES.MEMBER;
        GlobalVariable.isStandAlone = data.fed_role === '';
        //get the status of the chosen cluster
        const sessionCluster = this.localStorage.get(
          GlobalConstant.LOCAL_STORAGE_CLUSTER
        );
        const clusterInSession = sessionCluster
          ? JSON.parse(sessionCluster)
          : null;
        if (clusterInSession) {
          GlobalVariable.isRemote = clusterInSession.isRemote;
        } else {
          GlobalVariable.isRemote = false;
        }
      },
    });
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' &&
        ['', '#'].indexOf(target.getAttribute('href') || '') > -1
      )
        e.preventDefault();
    });
    this.commonHttpService.getGravatar().subscribe(val => {
      GlobalVariable.gravatar = val;
    });
    if (this.win.location.hash !== '#/login' && this.win.location.hash !== '') {
      this.authService
        .refreshToken(
          this.win.location.href.includes(GlobalConstant.PROXY_VALUE)
        )
        .subscribe(
          (userInfo: any) => {
            GlobalVariable.user = userInfo;
            GlobalVariable.nvToken = userInfo.token.token;
            GlobalVariable.isSUSESSO = userInfo.is_suse_authenticated;
            GlobalVariable.user.global_permissions =
              userInfo.token.global_permissions;
            GlobalVariable.user.remote_global_permissions =
              userInfo.token.remote_global_permissions;
            GlobalVariable.user.domain_permissions =
              userInfo.token.domain_permissions;
            GlobalVariable.user.extra_permissions =
              userInfo.token.extra_permissions;
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
            if (!GlobalVariable.hasInitializedSummary) {
              this.summaryService.getSummary().subscribe(summaryInfo => {
                GlobalVariable.isOpenShift =
                  summaryInfo.summary.platform === GlobalConstant.OPENSHIFT ||
                  summaryInfo.summary.platform === GlobalConstant.RANCHER;
                GlobalVariable.summary = summaryInfo.summary;
                this.isSummaryDone = true;
              });
            }
          },
          error => {
            this.localStorage.set(GlobalConstant.LOCAL_STORAGE_TIMEOUT, true);
            setTimeout(() => {
              location.reload();
            }, 1000);
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

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler = (event: Event) => {
    if (GlobalVariable.isSUSESSO) {
      this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF);
      this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TIMEOUT);
    }
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
          timeout = setTimeout(
            () => {
              fn(...args);
            },
            GlobalVariable.user.token.timeout * 1000 + 10000
          );
        }
        timerId = null;
      }, delay);
    };
  };

  private heartbeat = () => {
    let currTimer: number = new Date().getTime();
    if (this.win.location.hash !== '#/login') {
      if (currTimer - this.initTimer > 29000 || this.isFirstAction) {
        this.isFirstAction = false;
        this.initTimer = currTimer;
        this.authService.heartbeat().subscribe(
          response => {
            console.log('heartbeat...OK');
          },
          error => {
            console.log('heartbeat...NG');
          }
        );
      }
    }
  };
}
