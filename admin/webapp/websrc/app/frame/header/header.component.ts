import {
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';
import screenfull from 'screenfull';

import { SwitchersService } from '@core/switchers/switchers.service';
import { MenuService } from '@core/menu/menu.service';
import { MapConstant } from '@common/constants/map.constant';
import { Cluster, ClusterData } from '@common/types';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { isAuthorized } from '@common/utils/common.utils';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  navCollapsed = true;
  menuItems: Array<any> = [];
  router: Router = <Router>{};
  clusterName: string = '';
  clusterNameError: boolean = false;
  clusters: Cluster[] = [];
  clustersError: boolean = false;
  isMasterRole: boolean = false;
  isMemberRole: boolean = false;
  isStandaloneRole: boolean = false;
  isOnRemoteCluster: boolean = false;
  selectedCluster: Cluster | undefined;
  isSUSESSO: boolean = false;
  primaryMasterName: string = '';
  managedClusterName: string = '';
  isAllowedToOperateMultiCluster: boolean = false;
  isAllowedToRedirectMultiCluster: boolean = false;
  isFedQueryAllowed: boolean = false;
  get gravatarEnabled() {
    return GlobalVariable.gravatar;
  }

  email = '';
  username = '';
  displayRole = '';

  isNavSearchVisible: boolean = false;
  private _multiClusterSubScription;
  public isAuthReadConfig: boolean = false;
  public customPageHeader: SafeHtml = '';

  @ViewChild('fsbutton', { static: true }) fsbutton;

  constructor(
    public menu: MenuService,
    public notificationService: NotificationService,
    public multiClusterService: MultiClusterService,
    public translateService: TranslateService,
    public switchers: SwitchersService,
    public authUtilsService: AuthUtilsService,
    public injector: Injector,
    private sanitizer: DomSanitizer,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService
  ) {
    this.menuItems = menu.getMenu().slice(0, 4);
  }

  ngOnInit() {
    this.isSUSESSO = GlobalVariable.isSUSESSO;
    this.isNavSearchVisible = false;
    if(GlobalVariable.customPageHeader) {
      this.customPageHeader = this.sanitizer.bypassSecurityTrustHtml(GlobalVariable.customPageHeader);
    }
    this.router = this.injector.get(Router);

    this.router.events.subscribe(() => {
      window.scrollTo(0, 0);
      this.navCollapsed = true;
    });

    const resource = {
      multiClusterOp: {
        global: 2,
      },
      redirectAuth: {
        global: 3,
      },
      manageAuth: {
        global: 2,
      },
      policyAuth: {
        global: 3,
      },
      fedQueryAllowed: {
        global: 1,
      },
    };

    this.isAllowedToOperateMultiCluster = isAuthorized(
      GlobalVariable.user.roles,
      resource.multiClusterOp
    );

    this.isAllowedToRedirectMultiCluster = isAuthorized(
      GlobalVariable.user.roles,
      resource.redirectAuth
    );

    this.isAuthReadConfig = this.authUtilsService.getDisplayFlag('read_config');
    this.isFedQueryAllowed = isAuthorized(
      GlobalVariable.user.roles,
      resource.fedQueryAllowed
    );

    this.initMultiClusters();

    this.email = this.sessionStorage.get('token')?.emailHash;
    this.username = this.sessionStorage.get('token')?.token?.username;
    const role = this.sessionStorage.get('token')?.token?.role;
    this.displayRole = role ? role : 'Namespace User';

    this._multiClusterSubScription =
      this.multiClusterService.onRefreshClustersEvent$.subscribe(data => {
        this.initMultiClusters();
      });

    this._multiClusterSubScription =
      this.multiClusterService.onManageMemberClusterEvent$.subscribe(data => {
        this.initMultiClusters();
      });
  }

  ngOnDestroy() {
    this._multiClusterSubScription.unsubscribe();
  }

  toggleUserBlock(event) {
    event.preventDefault();
  }

  openNavSearch(event) {
    event.preventDefault();
    event.stopPropagation();
    this.setNavSearchVisible(true);
  }

  setNavSearchVisible(stat: boolean) {
    this.isNavSearchVisible = stat;
  }

  getNavSearchVisible() {
    return this.isNavSearchVisible;
  }

  toggleOffsidebar() {
    this.switchers.toggleFrameSwitcher('offsidebarOpen');
  }

  toggleCollapsedSidebar() {
    this.switchers.toggleFrameSwitcher('isCollapsed');
  }

  isCollapsedText() {
    return this.switchers.getFrameSwitcher('isCollapsedText');
  }

  focusMainContainer(event: MouseEvent) {
    const element = event.view?.window.document.getElementById(
      'main-content'
    ) as HTMLElement | undefined;
    const focusable = element?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      (focusable[0] as HTMLElement).focus();
    }
  }

  toggleFullScreen(event) {
    if (screenfull.enabled) {
      screenfull.toggle();
    }
  }

  goProfile() {
    this.router.navigate(['profile']);
  }

  goMultiCluster() {
    this.router.navigate(['multi-cluster']);
  }

  goFederatedPolicy() {
    this.router.navigate(['federated-policy']);
  }

  initMultiClusters() {
    if (this.isAuthReadConfig) {
      this.getClusterName();
    }

    if (this.isFedQueryAllowed) {
      this.getClusters();
    }
  }

  getClusterName() {
    this.multiClusterService.getClusterName().subscribe({
      next: clusterName => {
        this.clusterName = clusterName;
      },
      error: err => {
        this.clusterName = '';
        this.clusterNameError = true;
      },
    });
  }
  getClusters() {
    this.multiClusterService
      .getClusters()
      .pipe()
      .subscribe({
        next: (data: ClusterData) => {
          this.clusters = data.clusters || [];

          //init the cluster role
          this.isMemberRole = data.fed_role === MapConstant.FED_ROLES.MEMBER;
          this.isMasterRole = data.fed_role === MapConstant.FED_ROLES.MASTER;
          this.isStandaloneRole = data.fed_role === '';
          GlobalVariable.isMaster = this.isMasterRole;
          GlobalVariable.isMember = this.isMemberRole;
          GlobalVariable.isStandAlone = this.isStandaloneRole;

          const resource = {
            multiClusterOp: {
              global: 2,
            },
            manageAuth: {
              global: 3,
            },
            multiClusterView: {
              global: 1,
            },
          };

          this.isAllowedToRedirectMultiCluster =
            this.authUtilsService.getDisplayFlag('multi_cluster') ||
            (isAuthorized(GlobalVariable.user.roles, resource.multiClusterOp) &&
              data.fed_role !== MapConstant.FED_ROLES.MASTER);

          //get the status of the chosen cluster
          const sessionCluster = this.sessionStorage.get(
            GlobalConstant.SESSION_STORAGE_CLUSTER
          );
          const clusterInSession = sessionCluster
            ? JSON.parse(sessionCluster)
            : null;
          if (clusterInSession) {
            this.isOnRemoteCluster = clusterInSession.isRemote;
            GlobalVariable.isRemote = clusterInSession.isRemote;
          } else {
            GlobalVariable.isRemote = false;
          }

          if (GlobalVariable.isMaster) {
            this.isAllowedToOperateMultiCluster = isAuthorized(
              GlobalVariable.user.roles,
              resource.manageAuth
            );
            if (clusterInSession !== null) {
              this.selectedCluster = clusterInSession;
            } else {
              this.selectedCluster = this.clusters.find(cluster => {
                return cluster.clusterType === MapConstant.FED_ROLES.MASTER;
              });
            }
          }

          if (GlobalVariable.isMember) {
            this.isAllowedToOperateMultiCluster = isAuthorized(
              GlobalVariable.user.roles,
              resource.multiClusterView
            );
            this.clusters.forEach(cluster => {
              if (cluster.clusterType === MapConstant.FED_ROLES.MASTER) {
                this.primaryMasterName = cluster.name;
              } else {
                this.managedClusterName = cluster.name;
              }
            });
          }
        },
        error: error => {
          this.clustersError = true;
        },
      });
  }

  redirectCluster(cluster: Cluster) {
    let currentID = this.selectedCluster?.id;
    let selectedID = cluster.id;

    if (currentID !== selectedID) {
      if (this.selectedCluster?.clusterType === MapConstant.FED_ROLES.MASTER) {
        currentID = '';
      }

      let selectedItem = this.clusters.find(clusterNode => {
        return clusterNode.id === cluster.id;
      });

      if (selectedItem?.clusterType === MapConstant.FED_ROLES.MASTER) {
        selectedID = '';
      }

      this.multiClusterService.switchCluster(selectedID, currentID).subscribe({
        next: () => {
          this.selectedCluster = selectedItem;
          this.isOnRemoteCluster =
            this.selectedCluster?.clusterType !== MapConstant.FED_ROLES.MASTER;
          this.multiClusterService.refreshSummary();
          this.multiClusterService.dispatchSwitchEvent();
          //to save and restore the selected cluster in case the page gets refreshed
          GlobalVariable.isRemote = this.isOnRemoteCluster;
          const cluster = {
            isRemote: this.isOnRemoteCluster,
            id: this.selectedCluster?.id,
            name: this.selectedCluster?.name,
          };
          this.sessionStorage.set(
            GlobalConstant.SESSION_STORAGE_CLUSTER,
            JSON.stringify(cluster)
          );
        },
        error: error => {
          this.notificationService.openError(
            error,
            this.translateService.instant(
              'multiCluster.messages.redirect_failure',
              { name: cluster.name }
            )
          );
        },
      });
    }
  }

  logout() {
    this.router.navigate(['logout']);
  }
}
