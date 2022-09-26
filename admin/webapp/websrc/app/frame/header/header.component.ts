import {Component, OnInit, ViewChild, Injector, Inject} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MultiClusterService } from "@services/multi-cluster.service";
import { Router } from '@angular/router';
import screenfull from 'screenfull';

import { SwitchersService } from "@core/switchers/switchers.service";
import { MenuService } from "@core/menu/menu.service";
import { MapConstant } from "@common/constants/map.constant";
import { ClusterData, Cluster, SessionStorageCluster } from "@common/types";
import { SESSION_STORAGE, StorageService } from "ngx-webstorage-service";
import { GlobalConstant } from "@common/constants/global.constant";
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  navCollapsed = true;
  menuItems: Array<any> = [];
  router: Router = <Router>{};
  clusterName: string="";
  clusters: Cluster[] = [];
  isMasterRole: boolean = false;
  isMemberRole: boolean = false;
  isOrdinaryRole: boolean = false;
  isOnRemoteCluster: boolean=false;
  selectedCluster: Cluster|undefined;
  isSUSESSO: boolean;

  isNavSearchVisible: boolean = false;
  @ViewChild('fsbutton', { static: true }) fsbutton;

  constructor(
    public menu: MenuService,
    public multiClusterService: MultiClusterService,
    public switchers: SwitchersService,
    public injector: Injector,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService
  ) {
    this.menuItems = menu.getMenu().slice(0, 4);
  }

  ngOnInit() {
    this.isSUSESSO = GlobalVariable.isSUSESSO;
    this.isNavSearchVisible = false;

    var ua = window.navigator.userAgent;
    // if (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./)) {
    //     this.fsbutton.nativeElement.style.display = 'none';
    // }
    //
    // // Switch fullscreen icon indicator
    // const el = this.fsbutton.nativeElement.firstElementChild;
    // screenfull.on('change', () => {
    //     if (el)
    //         el.className = screenfull.isFullscreen ? 'fa fa-compress' : 'fa fa-expand';
    // });

    this.router = this.injector.get(Router);

    this.router.events.subscribe(val => {
      window.scrollTo(0, 0);
      this.navCollapsed = true;
    });

    this.initMultiClusters();

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

  toggleCollapsedSideabar() {
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
    this.router.navigate(["multi-cluster"]);
  }

  goFederatedPolicy() {
    this.router.navigate(['federated-policy']);
  }

  initMultiClusters(){
    this.getClusterName();
    this.getClusters();

  }

  getClusterName(){
    this.multiClusterService.getClusterName().pipe()
      .subscribe({
        next: (data: any) => {
          this.clusterName = data.config.cluster_name;
        }
      });
  }
  getClusters() {
    this.multiClusterService.getClusters().pipe()
      .subscribe(
        {
          next: (data: ClusterData) => {
            this.clusters = data.clusters || [];
            this.isMemberRole = data.fed_role === MapConstant.FED_ROLES.MEMBER;
            this.isMasterRole = data.fed_role === MapConstant.FED_ROLES.MASTER;
            GlobalVariable.isMaster = this.isMasterRole;
            GlobalVariable.isMember = this.isMemberRole;
            this.isOrdinaryRole = data.fed_role === "";

            //get the status of the chosen cluster
            const sessionCluster = this.sessionStorage.get(GlobalConstant.SESSION_STORAGE_CLUSTER);

            const cluster = sessionCluster ? JSON.parse(sessionCluster): null;

            if(cluster !== null){
              this.isOnRemoteCluster = cluster.isOnRemoteCluster;
              this.selectedCluster = cluster;

            }else{
              this.selectedCluster = this.clusters.find(cluster => {
                return cluster.clusterType === MapConstant.FED_ROLES.MASTER;
              });
              console.log("selected:",this.selectedCluster);
            }


          },
          error: (error) => {

          }
        }
      );
  }

  redirectCluster(cluster: Cluster){
    let currentID = this.selectedCluster?.id;
    let selectedID = cluster.id;

    if( currentID !== selectedID ){
      if(this.selectedCluster?.clusterType === MapConstant.FED_ROLES.MASTER){
        currentID = "";
      }

      let selectedItem = this.clusters.find(clusterNode => {
        return clusterNode.id === cluster.id;
      });

      if(selectedItem?.clusterType === MapConstant.FED_ROLES.MASTER){
        selectedID = "";
      }

      this.multiClusterService.switchCluster(selectedID, currentID)
        .subscribe({
          next: (res) => {
            this.selectedCluster = selectedItem;
            this.isOnRemoteCluster = this.selectedCluster?.clusterType !== MapConstant.FED_ROLES.MASTER;
            this.multiClusterService.dispatchSwitchEvent();

            //to save and restore the selected cluster in case the page gets refreshed
            const cluster = {
              isRemote: this.isOnRemoteCluster,
              id: this.selectedCluster?.id,
              name: this.selectedCluster?.name
            };
            this.sessionStorage.set(GlobalConstant.SESSION_STORAGE_CLUSTER, JSON.stringify(cluster));

          },
          error: (error) => {
          }
        });

    }else{
      console.log("same cluster");
    }

  }

  logout() {
    this.router.navigate(['logout']);
  }
}
