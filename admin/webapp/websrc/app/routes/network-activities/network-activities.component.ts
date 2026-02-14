import { Options } from '@angular-slider/ngx-slider';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import G6, { Graph } from '@antv/g6';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { Group } from '@common/types';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import { AdvancedFilter } from '@common/types/network-activities/advancedFilter';
import {
  Blacklist,
  GraphItem,
} from '@common/types/network-activities/blacklist';
import { GraphDataSet } from '@common/types/network-activities/graphData';
import { PodDetails } from '@common/types/network-activities/podDetails';
import {
  GraphSettings,
  Settings,
} from '@common/types/network-activities/settings';
import { UtilsService } from '@common/utils/app.utils';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { SwitchersService } from '@core/switchers/switchers.service';
import { TranslateService } from '@ngx-translate/core';
import { GraphService } from '@routes/network-activities/graph.service';
import { SniffService } from '@routes/network-activities/sniffer/sniff.service';
import { GroupsService } from '@services/groups.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { NotificationService } from '@services/notification.service';
import { GridOptions } from 'ag-grid-community';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { fromEvent, interval, Observable, Subscription } from 'rxjs';
import { FrameService } from '../../frame/frame.service';
import { ConversationPair } from './edge-details/edge-details.component';

@Component({
  standalone: false,
  selector: 'app-network-activities',
  templateUrl: './network-activities.component.html',
  styleUrls: ['./network-activities.component.scss'],
})
export class NetworkActivitiesComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  private data: GraphDataSet = { nodes: [], edges: [] };
  serverData: GraphDataSet = { nodes: [], edges: [] };
  domainGridOptions: GridOptions = <GridOptions>{};

  private w: any;
  resizeObservable$: Observable<Event> = <Observable<Event>>{};
  resizeSubscription$: Subscription = <Subscription>{};

  private readonly TOP_BAR = 65;
  private readonly SIDE_BAR = 220;
  private readonly SIDE_BAR_S = 50;
  private readonly PADDING = 26 * 2 + 5 * 2;
  private user = GlobalVariable.user.token.username;

  hiddenItemIds: string[] = [];
  inComingNodes: string[] = [];
  outGoingNodes: string[] = [];
  private readonly nodeToClusterEdgesMap = new Map();
  private readonly collapsedDomains = new Map();
  private graph: Graph = <Graph>{};

  private lastRevealedNodeIds: string[] = [];
  private _toggleSidebarSubscription;

  public popupState: ActivityState;

  isWriteNetworkAuthorized: boolean = false;
  gpuEnabled = false;
  settings: Settings = <Settings>{};
  advFilter: AdvancedFilter = <AdvancedFilter>{};
  blacklist: Blacklist;

  selectedEdge;
  edgeDetails;

  tooltipEl;
  container: HTMLElement | null = null;
  endpointOnFocus: string = '';

  containerId: string = '';
  containerName: string = '';
  // nextName: any;

  //region Active Session
  currentNodeName: string = '';
  activeSessionGridHeight: number = 0;
  conversations: any[] = [];
  autoRefresh: boolean = false;
  activeSessionGridOptions!: GridOptions;
  //endregion

  conversationDetail: any;
  private showRuleId: boolean = false;
  entriesGridHeight: number = 0;
  convHisGridOptions!: GridOptions;

  sniffers: any;
  snifferGridHeight: number = 0;
  sniffer: any;

  domain: any;

  hostId: string = '';
  groupId: string = '';
  group: Group = <Group>{};
  isGroupInfoReady: boolean = false;

  pod: PodDetails = <PodDetails>{};
  isPodInfoReady: boolean = false;

  CONTAINER_TO_ICON = {
    discover: 'container-d',
    monitor: 'container-m',
    protect: 'container-p',
  };
  SERVICE_MESH_TO_ICON = {
    discover: 'serviceMesh-d',
    monitor: 'serviceMesh-m',
    protect: 'serviceMesh-p',
  };
  HOST_TO_ICON = {
    discover: 'host-d',
    monitor: 'host-m',
    protect: 'host-p',
  };
  RISKY_STATUSES = [
    'Info',
    'Low',
    'Medium',
    'High',
    'Critical',
    'violate',
    'deny',
  ];

  domains: GraphItem[] = [];
  groups: { name: string; displayName: string }[] = [];
  endpoints: { name: string; id: string }[] = [];
  refreshing = false;

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private authUtilsService: AuthUtilsService,
    private assetsHttpService: AssetsHttpService,
    private graphService: GraphService,
    private groupsService: GroupsService,
    private sniffService: SniffService,
    private multiClusterService: MultiClusterService,
    private dialog: MatDialog,
    private utils: UtilsService,
    private switchers: SwitchersService,
    private frameService: FrameService
  ) {
    this.w = GlobalVariable.window;
    this.popupState = new ActivityState(PopupState.onInit);
    this.blacklist = {
      domains: [],
      groups: [],
      endpoints: [],
      hideUnmanaged: false,
    };
  }

  private initSettings() {
    this.settings = {
      showSysNode: this.localStorage.get(this.user + '-showSysNode')
        ? JSON.parse(this.localStorage.get(this.user + '-showSysNode')) || false
        : false,
      showSysApp: this.localStorage.get(this.user + '-showSysApp')
        ? JSON.parse(this.localStorage.get(this.user + '-showSysApp')) || false
        : false,
      showLegend: this.localStorage.get(this.user + '-showLegend')
        ? JSON.parse(this.localStorage.get(this.user + '-showLegend')) || false
        : false,
      hiddenDomains: [],
      hiddenGroups: [],
      persistent: this.localStorage.get(this.user + '-persistent')
        ? JSON.parse(this.localStorage.get(this.user + '-persistent')) || false
        : false,
      gpuEnabled: this.useGpu() || this.gpuEnabled,
    };
  }

  private loadAdvFilters() {
    const saved = this.localStorage.get(this.user + '-advFilter');
    if (saved) {
      this.advFilter = JSON.parse(
        this.localStorage.get(this.user + '-advFilter')
      );
      if (this.advFilter) this.graphService.setAdvFilter(this.advFilter);
    } else this.advFilter = this.graphService.getAdvFilter();
  }

  private loadBlacklist() {
    const saved = this.localStorage.get(this.user + '-blacklist');
    if (saved) {
      this.blacklist = JSON.parse(
        this.localStorage.get(this.user + '-blacklist')
      );
      if (this.blacklist) this.graphService.setBlacklist(this.blacklist);
    }
    if (!this.blacklist) {
      this.blacklist = this.graphService.getBlacklist();
    }
  }

  private useGpu(): boolean {
    let gpuEnabled;
    if (this.localStorage.get('_gpuEnabled')) {
      gpuEnabled = JSON.parse(this.localStorage.get('_gpuEnabled'));
      if (gpuEnabled !== null) return gpuEnabled;
    }
    return false;
  }

  private prepareGraphics(
    height: number,
    width: number,
    isWriteNetworkAuthorized: boolean
  ) {
    //region I18 items
    const DETAILS = this.translate.instant('network.nodeDetails.DETAILS');
    const EXPAND = this.translate.instant('network.popup.EXPAND');
    const COLLAPSE = this.translate.instant('network.popup.COLLAPSE_GROUP');
    const COLLAPSE_DOMAIN = this.translate.instant(
      'network.popup.COLLAPSE_DOMAIN'
    );
    const ACTIVE_SESSIONS = this.translate.instant(
      'network.nodeDetails.ACTIVE_SESSIONS'
    );
    const PACKET_CAPTURE = this.translate.instant('network.nodeDetails.SNIFF');
    const HIDE_NODE = this.translate.instant('network.nodeDetails.HIDE_NODE');
    const HIDE_INCOMING = this.translate.instant(
      'network.nodeDetails.HIDE_INCOMING'
    );
    const SHOW_INCOMING = this.translate.instant(
      'network.nodeDetails.SHOW_INCOMING'
    );
    const HIDE_OUTGOING = this.translate.instant(
      'network.nodeDetails.HIDE_OUTGOING'
    );
    const SHOW_OUTGOING = this.translate.instant(
      'network.nodeDetails.SHOW_OUTGOING'
    );
    const HIDE_EDGE = this.translate.instant('network.nodeDetails.HIDE_EDGE');
    // const SHOW_ALL = this.translate.instant('network.nodeDetails.SHOW_ALL');
    const FIT_VIEW = this.translate.instant('network.FIT_VIEW');
    const DISCOVER = this.translate.instant('enum.DISCOVER');
    const MONITOR = this.translate.instant('enum.MONITOR');
    const PROTECT = this.translate.instant('enum.PROTECT');
    const QUARANTINE = this.translate.instant('network.nodeDetails.QUARANTINE');
    const UN_QUARANTINE = this.translate.instant(
      'network.nodeDetails.UN_QUARANTINE'
    );
    //endregion

    const inIncome = id => this.inComingNodes.includes(id);
    const inOutGoing = id => this.outGoingNodes.includes(id);
    const contextMenu = new G6.Menu({
      // @ts-ignore
      getContent(evt) {
        if (evt !== undefined) {
          const getMenuVisibility = (visibilityMap, menuName) => {
            return visibilityMap[menuName] ? 'block' : 'none';
          };
          const item = evt.item;
          if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
            return `<ul class="right-menu">
                    <li id='fitView'>
                      <em class="fa fa-arrows-h text-info "></em>${FIT_VIEW}</li>
                </ul>`;
          } else if (item) {
            const itemType = item.getType();
            const model: any = item.getModel();
            if (itemType && model) {
              const NO_DETAIL_NODE = [
                'nvUnmanagedNode',
                'nvUnmanagedWorkload',
                'external',
                // "_namespace",
              ];
              // @ts-ignore
              const MENU_VISIBILITY_MAP = {
                info:
                  NO_DETAIL_NODE.indexOf(model.cluster) === -1 &&
                  NO_DETAIL_NODE.indexOf(model.domain) === -1 &&
                  !(model.id && model.id === 'nodes') &&
                  model.state !== 'unmanaged' &&
                  !(model.group && model.group === 'ip_service'),
                expand: ['group', 'domain'].includes(model.kind),
                discover:
                  ((model.kind === 'group' &&
                    model.group !== 'ip_service' &&
                    model.policyMode &&
                    model.policyMode.toLowerCase() !== 'discover') ||
                    (model.group &&
                      (model.group.startsWith('container') ||
                        model.group.startsWith('mesh')) &&
                      model.policyMode &&
                      model.policyMode.toLowerCase() !== 'discover')) &&
                  isWriteNetworkAuthorized,
                monitor:
                  ((model.kind === 'group' &&
                    model.group !== 'ip_service' &&
                    model.policyMode &&
                    model.policyMode.toLowerCase() !== 'monitor') ||
                    (model.group &&
                      (model.group.startsWith('container') ||
                        model.group.startsWith('mesh')) &&
                      model.policyMode &&
                      model.policyMode.toLowerCase() !== 'monitor')) &&
                  isWriteNetworkAuthorized,
                protect:
                  ((model.kind === 'group' &&
                    model.group !== 'ip_service' &&
                    model.policyMode &&
                    model.policyMode.toLowerCase() !== 'protect') ||
                    (model.group &&
                      (model.group.startsWith('container') ||
                        model.group.startsWith('mesh')) &&
                      model.policyMode &&
                      model.policyMode.toLowerCase() !== 'protect')) &&
                  isWriteNetworkAuthorized,
                collapse: false,
                collapseDomain:
                  model.id !== 'external' &&
                  model.id !== 'nodes' &&
                  model.kind !== 'domain' &&
                  !(model.group && model.group === 'host'),
                //Todo: add platform check back
                // && $scope.summary.platform.toLowerCase().indexOf("kubernetes") !== -1,
                activeSessions:
                  model.group &&
                  (model.group.startsWith('container') ||
                    model.group.startsWith('mesh')) &&
                  model.state !== 'unmanaged',
                sniff:
                  model.group &&
                  model.cap_sniff &&
                  (model.group.startsWith('container') ||
                    model.group.startsWith('mesh')),
                quarantine:
                  model.cap_quarantine &&
                  model.state !== 'quarantined' &&
                  isWriteNetworkAuthorized,
                unQuarantine:
                  model.cap_quarantine &&
                  model.state === 'quarantined' &&
                  isWriteNetworkAuthorized,
                hide: true,
                hideInComing: !inIncome(model.id),
                showInComing: inIncome(model.id),
                hideOutGoing: !inOutGoing(model.id),
                showOutGoing: inOutGoing(model.id),
              };
              if (itemType === 'node') {
                return `<ul class="right-menu">
                        <li id='info' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'info'
                        )};">
                          <em class="fa fa-info-circle text-info" style="margin-right: 8px;"></em>${DETAILS}
                        </li>
                        <li id='expand' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'expand'
                        )};">
                          <em class="fa fa-expand text-info" style="margin-right: 8px;"></em>${EXPAND}
                        </li>
                        <li id='collapse' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'collapse'
                        )};">
                          <em class="fa fa-compress text-info" style="margin-right: 8px;"></em>${COLLAPSE}
                        </li>
                        <li id='collapseDomain' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'collapseDomain'
                        )};">
                          <em class="fa fa-compress text-info" style="margin-right: 8px;"></em>${COLLAPSE_DOMAIN}
                        </li>
                        <li id='activeSessions' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'activeSessions'
                        )};">
                          <em class="fa fa-list-alt text-info" style="margin-right: 8px;"></em>${ACTIVE_SESSIONS}
                        </li>
                        <li id='sniff' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'sniff'
                        )};">
                          <em class="fa fa-video text-info" style="margin-right: 8px;"></em>${PACKET_CAPTURE}
                        </li>
                        <li id='discover' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'discover'
                        )};">
                          <em class="fa fa-binoculars text-info" style="margin-right: 8px;"></em>${DISCOVER}
                        </li>
                        <li id='monitor' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'monitor'
                        )};">
                          <em class="fa fa-bell text-info" style="margin-right: 8px;"></em>${MONITOR}
                        </li>
                        <li id='protect' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'protect'
                        )};">
                          <em class="fa fa-shield-alt text-info" style="margin-right: 8px;"></em>${PROTECT}
                        </li>
                        <li id='quarantine' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'quarantine'
                        )};">
                          <em class="fa fa-ban text-pink" style="margin-right: 8px;"></em>${QUARANTINE}
                        </li>
                        <li id='unQuarantine' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'unQuarantine'
                        )};">
                          <em class="fa fa-ban text-pink" style="margin-right: 8px;"></em>${UN_QUARANTINE}
                        </li>
                        <li id='hide' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'hide'
                        )};">
                          <em class="fa fa-eye-slash text-info" style="margin-right: 8px;"></em>${HIDE_NODE}
                        </li>
                        <li id='hideInComing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'hideInComing'
                        )};">
                          <em class="fa fa-eye-slash text-info" style="margin-right: 8px;"></em>${HIDE_INCOMING}
                        </li>
                        <li id='showInComing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'showInComing'
                        )};">
                          <em class="fa fa-eye text-info" style="margin-right: 8px;"></em>${SHOW_INCOMING}
                        </li>
                        <li id='hideOutGoing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'hideOutGoing'
                        )};">
                          <em class="fa fa-eye-slash text-info" style="margin-right: 8px;"></em>${HIDE_OUTGOING}
                        </li>
                        <li id='showOutGoing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          'showOutGoing'
                        )};">
                          <em class="fa fa-eye text-info" style="margin-right: 8px;"></em>${SHOW_OUTGOING}
                        </li>
                      </ul>`;
              } else if (itemType === 'edge') {
                return `<ul class="right-menu">
                        <li id='hide'>${HIDE_EDGE}</li>
                      </ul>`;
              } else if (itemType === 'combo') {
                return `<ul class="right-menu">
                        <li id='collapse'>
                          <em class="fa fa-compress text-info "></em>${COLLAPSE}
                        </li>
                        <li id='hide'>
                          <em class="fa fa-eye-slash text-info "></em>${HIDE_NODE}
                        </li>
                      </ul>`;
              }
            }
          }
        }
      },
      handleMenuClick: (target, item) => {
        const model = item && item.getModel();
        const liItems = target.id.split('-');
        switch (liItems[0]) {
          case 'info':
            showNodeInfo(model, item);
            break;
          case 'hide':
            hideNode(item);
            break;
          case 'hideInComing':
            hideInComing(item);
            break;
          case 'showInComing':
            showInComing(item);
            break;
          case 'hideOutGoing':
            hideOutGoing(item);
            break;
          case 'showOutGoing':
            showOutGoing(item);
            break;
          case 'expand':
            expand(item);
            break;
          case 'collapse':
            collapseCluster(item);
            break;
          case 'collapseDomain':
            collapseDomain(item);
            break;
          case 'show':
            // showItems(graph);
            break;
          case 'fitView':
            autoZoom(this.graph);
            break;
          case 'activeSessions':
            this.showSessions(model);
            break;
          case 'sniff':
            this.showSniffer(model);
            break;
          case 'discover':
            switchModeOnMenu('Discover', item, this.graph);
            break;
          case 'monitor':
            switchModeOnMenu('Monitor', item, this.graph);
            break;
          case 'protect':
            switchModeOnMenu('Protect', item, this.graph);
            break;
          case 'quarantine':
            this.quarantine(item, true);
            break;
          case 'unQuarantine':
            this.quarantine(item, false);
            break;
          default:
            break;
        }
      },
      // offsetX and offsetY include the padding of the parent container
      offsetX: 16 + 10,
      offsetY: 0,
      // the types of items that allow the menu show up
      itemTypes: ['node', 'edge', 'combo', 'canvas'],
    });

    const grid = new G6.Grid();

    const DELTA = 0.05;
    const zoomSensitivity = 2;
    const zoomOut = graph => {
      const currentZoom = graph.getZoom();
      const ratioOut = 1 / (1 - DELTA * zoomSensitivity);
      const maxZoom = graph.get('maxZoom');
      if (ratioOut * currentZoom > maxZoom) {
        return;
      }
      graph.zoomTo(currentZoom * ratioOut);
    };
    const zoomIn = graph => {
      const currentZoom = graph.getZoom();
      const ratioIn = 1 - DELTA * zoomSensitivity;
      const minZoom = graph.get('minZoom');
      if (ratioIn * currentZoom < minZoom) {
        return;
      }
      graph.zoomTo(currentZoom * ratioIn);
    };

    const autoZoom = graph => {
      graph.fitView([20, 20]);
    };

    const getNodeTypeToSwitch = item => {
      let model = item.getModel();
      let groupName = '';
      let nodeType = '';
      if (model.group && model.group.startsWith('container')) {
        groupName = model.clusterId;
        nodeType = 'container';
      }
      if (model.group && model.group.startsWith('mesh')) {
        groupName = model.clusterId;
        nodeType = 'mesh';
      }
      if (model.kind && model.kind === 'group') {
        groupName = model.id;
        nodeType = 'group';
      }
      return { nodeType, groupName };
    };

    const updatePolicyModeOnNode = (selectedMode, item, nodeType, graph) => {
      if (nodeType === 'group') {
        graph.updateItem(item, {
          policyMode: selectedMode,
          icon: {
            img: `assets/img/icons/graph/${
              GROUP_TO_ICON[selectedMode.toLowerCase()]
            }.svg`,
          },
          style: {
            stroke: this.graphService.strokeColor[selectedMode],
            fill: this.graphService.fillColor[selectedMode],
          },
        });
      }

      const switchItemMode = item => {
        graph.updateItem(item, {
          policyMode: selectedMode,
          icon: {
            img:
              nodeType === 'container'
                ? `assets/img/icons/graph/${
                    this.CONTAINER_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`
                : `assets/img/icons/graph/${
                    this.SERVICE_MESH_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`,
          },
          style: {
            stroke: this.graphService.strokeColor[selectedMode],
            fill: this.graphService.fillColor[selectedMode],
          },
        });
      };

      if (['container', 'mesh'].includes(nodeType)) {
        const combo = item.getModel().comboId
          ? graph.findById(item.getModel().comboId)
          : null;

        const members = combo ? combo.getNodes() : [];

        if (members.length > 0) {
          //The item is combo, update policy mode of all pods in group
          members.forEach(item => {
            switchItemMode(item);
          });
          const group = item.getModel().clusterId
            ? graph.findById(item.getModel().clusterId)
            : null;
          if (group) {
            graph.updateItem(group, {
              policyMode: selectedMode,
              icon: {
                img: `assets/img/icons/graph/${
                  GROUP_TO_ICON[selectedMode.toLowerCase()]
                }.svg`,
              },
              style: {
                stroke: this.graphService.strokeColor[selectedMode],
                fill: this.graphService.fillColor[selectedMode],
              },
            });
          }
        } else {
          switchItemMode(item);
        }
      }
    };

    const switchModeOnMenu = (policyMode, item, graph) => {
      let { nodeType, groupName } = getNodeTypeToSwitch(item);

      if (groupName)
        this.graphService.switchServiceMode(policyMode, groupName).subscribe(
          () => {
            this.notificationService.open(
              this.translate.instant('service.ALL_SUBMIT_OK')
            );
            setTimeout(() => {
              updatePolicyModeOnNode(policyMode, item, nodeType, graph);
            }, 500);
          },
          error => {
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                error,
                this.translate.instant('service.ALL_SUBMIT_FAILED'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
    };

    const quickSearch = () => {
      this.popupState.leave();
      this.stopRefreshSession();
      setTimeout(() => {
        this.popupState.transitTo(PopupState.onQuickSearch);
      }, 300);
    };

    const showFilter = () => {
      this.popupState.leave();
      this.stopRefreshSession();
      this.domains = this.graphService
        .getDomains()
        .map(domain => ({ name: domain.name }));
      this.groups = this.graphService.getGroups().map(group => ({
        name: group.name,
        displayName: getServiceName(group.name),
      }));
      setTimeout(() => {
        if (this.domains.length === 0 && this.groups.length === 0) {
          this.notificationService.open(
            this.translate.instant('network.NO_FILTER_ITEMS'),
            GlobalConstant.NOTIFICATION_TYPE.WARNING
          );
          return;
        }
        this.popupState.transitTo(PopupState.onAdvFilter);
      }, 300);
    };

    const getServiceName = nvName => {
      const items = nvName.split('.');
      if (items && items.length > 2 && items[0] === 'nv')
        return items.slice(1, -1).join('.');
      return nvName;
    };

    const showBlacklist = () => {
      this.popupState.leave();
      this.stopRefreshSession();
      this.domains = this.graphService
        .getDomains()
        .map(domain => ({ name: domain.name }));
      this.groups = this.graphService.getGroups().map(group => ({
        name: group.name,
        displayName: getServiceName(group.name),
      }));
      this.endpoints = this.serverData.nodes.map(node => {
        return { name: node.label, id: node.id };
      });
      setTimeout(() => {
        if (this.domains.length === 0 && this.groups.length === 0) {
          this.notificationService.open(
            this.translate.instant('network.NO_FILTER_ITEMS'),
            GlobalConstant.NOTIFICATION_TYPE.WARNING
          );
          return;
        }
        this.popupState.transitTo(PopupState.onBlacklist);
      }, 300);
    };

    const shot = graph => {
      const today = new Date().toLocaleDateString();
      graph.downloadImage(`Graph_${today}`, 'image/png', 'white');
      setTimeout(() => {
        autoZoom(graph);
      }, 300);
    };

    const showLegend = () =>
      (this.settings.showLegend = !this.settings.showLegend);

    const refresh = () => this.refresh();

    const codeActionMap = {
      zoomOut: zoomOut,
      zoomIn: zoomIn,
      autoZoom: autoZoom,
      quickSearch: quickSearch,
      filter: showFilter,
      blacklist: showBlacklist,
      shot: shot,
      info: showLegend,
      refresh: refresh,
    };

    const toolbar = new G6.ToolBar({
      className: 'g6-component-toolbar',
      getContent: () => {
        return `
          <ul class='g6-component-toolbar'>
            <li code='zoomOut' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                 <path d="M474 152m8 0l60 0q8 0 8 8l0 704q0 8-8 8l-60 0q-8 0-8-8l0-704q0-8 8-8Z" ></path><path d="M168 474m8 0l672 0q8 0 8 8l0 60q0 8-8 8l-672 0q-8 0-8-8l0-60q0-8 8-8Z">
                 </path>
              </svg>
            </li>
            <li code='zoomIn' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"  width="24" height="24">
              <path d="M853.333333 554.666667H170.666667c-23.466667 0-42.666667-19.2-42.666667-42.666667s19.2-42.666667 42.666667-42.666667h682.666666c23.466667 0 42.666667 19.2 42.666667 42.666667s-19.2 42.666667-42.666667 42.666667z">
                </path>
              </svg>
            </li>
            <li code='autoZoom' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M335.104 411.562667a21.333333 21.333333 0 0 1 0 30.208L286.165333 490.666667h161.493334a21.333333 21.333333 0 1 1 0 42.666666H286.165333l48.938667 48.896a21.333333 21.333333 0 0 1-30.208 30.208l-85.333333-85.333333a21.333333 21.333333 0 0 1 0-30.208l85.333333-85.333333a21.333333 21.333333 0 0 1 30.208 0zM737.834667 533.333333l-48.938667 48.896a21.333333 21.333333 0 0 0 30.208 30.208l85.333333-85.333333a21.333333 21.333333 0 0 0 0-30.208l-85.333333-85.333333a21.333333 21.333333 0 0 0-30.208 30.208l48.938667 48.896h-161.493334a21.333333 21.333333 0 1 0 0 42.666666h161.493334z" ></path><path d="M85.333333 288A117.333333 117.333333 0 0 1 202.666667 170.666667h618.666666A117.333333 117.333333 0 0 1 938.666667 288v448A117.333333 117.333333 0 0 1 821.333333 853.333333H202.666667A117.333333 117.333333 0 0 1 85.333333 736V288zM202.666667 234.666667c-29.44 0-53.333333 23.893333-53.333334 53.333333v448c0 29.44 23.893333 53.333333 53.333334 53.333333h618.666666c29.44 0 53.333333-23.893333 53.333334-53.333333V288c0-29.44-23.893333-53.333333-53.333334-53.333333H202.666667z" >
                </path>
              </svg>
            </li>
            <li code='quickSearch' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M416 192C537.6 192 640 294.4 640 416S537.6 640 416 640 192 537.6 192 416 294.4 192 416 192M416 128C256 128 128 256 128 416S256 704 416 704 704 576 704 416 576 128 416 128L416 128z">
                </path>
                <path d="M832 864c-6.4 0-19.2 0-25.6-6.4l-192-192c-12.8-12.8-12.8-32 0-44.8s32-12.8 44.8 0l192 192c12.8 12.8 12.8 32 0 44.8C851.2 864 838.4 864 832 864z">
                </path>
              </svg>
            </li>
            <li code='filter' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M867.392 874.666667a128.042667 128.042667 0 0 1-241.450667 0H106.666667a42.666667 42.666667 0 1 1 0-85.333334h519.274666a128.042667 128.042667 0 0 1 241.450667 0H917.333333a42.666667 42.666667 0 1 1 0 85.333334h-49.941333zM704 832a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 0 0-85.333333 0z m-71.274667-597.333333a128.042667 128.042667 0 0 1-241.450666 0H106.666667a42.666667 42.666667 0 1 1 0-85.333334h284.608A128.042667 128.042667 0 0 1 632.746667 149.333333H917.333333a42.666667 42.666667 0 1 1 0 85.333334H632.725333zM469.333333 192a42.666667 42.666667 0 1 0 85.333334 0 42.666667 42.666667 0 0 0-85.333334 0z m448 362.666667H398.058667A128.042667 128.042667 0 0 1 156.586667 554.666667H106.666667a42.666667 42.666667 0 1 1 0-85.333334h49.941333a128.042667 128.042667 0 0 1 241.450667 0H917.333333a42.666667 42.666667 0 1 1 0 85.333334z m-682.666666-42.666667a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 0 0-85.333333 0z" >
                </path>
              </svg>
            </li>
            <li code="blacklist" style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M956.8 496c-41.6-70.4-99.2-147.2-176-204.8l105.6-105.6c12.8-12.8 12.8-32 0-44.8s-32-12.8-44.8 0l-115.2 115.2C665.6 214.4 592 192 512 192 297.6 192 153.6 358.4 67.2 496c-6.4 9.6-6.4 22.4 0 32 41.6 70.4 102.4 147.2 176 204.8l-108.8 108.8c-12.8 12.8-12.8 32 0 44.8C144 892.8 150.4 896 160 896s16-3.2 22.4-9.6l115.2-115.2c60.8 38.4 134.4 60.8 214.4 60.8 185.6 0 374.4-128 444.8-307.2C960 515.2 960 505.6 956.8 496zM134.4 512c76.8-121.6 201.6-256 377.6-256 60.8 0 118.4 16 166.4 44.8l-80 80C576 361.6 544 352 512 352c-89.6 0-160 70.4-160 160 0 32 9.6 64 25.6 89.6l-89.6 89.6C224 640 172.8 572.8 134.4 512zM608 512c0 54.4-41.6 96-96 96-16 0-28.8-3.2-41.6-9.6l128-128C604.8 483.2 608 496 608 512zM416 512c0-54.4 41.6-96 96-96 16 0 28.8 3.2 41.6 9.6l-128 128C419.2 540.8 416 528 416 512zM512 768c-60.8 0-118.4-16-166.4-44.8l80-80C448 662.4 480 672 512 672c89.6 0 160-70.4 160-160 0-32-9.6-64-25.6-89.6l89.6-89.6c67.2 51.2 118.4 118.4 156.8 179.2C825.6 659.2 665.6 768 512 768z">
                </path>
              </svg>
            </li>
            <li code='shot' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M429.653333 170.666667a42.666667 42.666667 0 0 0-35.498666 18.986666l-59.989334 90.026667A42.666667 42.666667 0 0 1 298.666667 298.666667H170.666667a42.666667 42.666667 0 0 0-42.666667 42.666666v469.333334a42.666667 42.666667 0 0 0 42.666667 42.666666h682.666666a42.666667 42.666667 0 0 0 42.666667-42.666666V341.333333a42.666667 42.666667 0 0 0-42.666667-42.666666h-21.333333a42.666667 42.666667 0 1 1 0-85.333334h21.333333a128 128 0 0 1 128 128v469.333334a128 128 0 0 1-128 128H170.666667a128 128 0 0 1-128-128V341.333333a128 128 0 0 1 128-128h105.173333l47.36-70.997333A128 128 0 0 1 429.653333 85.333333h164.693334a128 128 0 0 1 106.496 57.002667l45.781333 68.693333a42.666667 42.666667 0 1 1-70.997333 47.317334l-45.781334-68.693334A42.666667 42.666667 0 0 0 594.346667 170.666667h-164.693334z" ></path><path d="M512 426.666667a128 128 0 1 0 0 256 128 128 0 0 0 0-256z m-213.333333 128a213.333333 213.333333 0 1 1 426.666666 0 213.333333 213.333333 0 0 1-426.666666 0zM192 405.333333a42.666667 42.666667 0 0 1 42.666667-42.666666H256a42.666667 42.666667 0 0 1 0 85.333333h-21.333333a42.666667 42.666667 0 0 1-42.666667-42.666667z" >
                </path>
              </svg>
            </li>
            <li code="info" style='padding: 0'>
               <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"  width="20" height="24">
                <path d="M334.016 727.04a32 32 0 1 0 0-64 32 32 0 0 0 0 64z m0-183.04a32 32 0 1 0 0-64 32 32 0 0 0 0 64z m0-182.016a32 32 0 1 0 0-64 32 32 0 0 0 0 64z m478.976-279.04H211.008c-37.568 0.064-67.968 30.528-68.032 68.032v722.048c0.064 37.504 30.464 67.968 68.032 67.968h601.984c37.568 0 67.968-30.464 68.032-67.968V150.976c-0.064-37.504-30.464-67.968-68.032-67.968z m-3.968 786.048H214.976V155.008h594.048v713.984zM414.016 296h307.968c5.376 0 8 2.688 8 8v48c0 5.312-2.624 8-8 8H414.08c-5.376 0-8-2.688-8-8v-48c0-5.312 2.624-8 8-8z m0 184h307.968c5.376 0 8 2.688 8 8v48c0 5.312-2.624 8-8 8H414.08c-5.376 0-8-2.688-8-8v-48c0-5.312 2.624-8 8-8z m0 184h307.968c5.376 0 8 2.688 8 8v48c0 5.312-2.624 8-8 8H414.08c-5.376 0-8-2.688-8-8v-48c0-5.312 2.624-8 8-8z">
                </path>
               </svg>
            </li>
            <li code='refresh' style='padding: 0'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M852 678.4c-5.6 0-16.8-5.6-22.4-5.6L696 539.2c-11.2-11.2-11.2-28 0-39.2s28-11.2 39.2 0l116.8 116.8 116.8-116.8c11.2-11.2 28-11.2 39.2 0s11.2 28 0 39.2l-133.6 133.6c-11.2 0.8-16.8 5.6-22.4 5.6zM305.6 539.2c-5.6 0-16.8-5.6-22.4-5.6L172 416.8 55.2 533.6c-11.2 11.2-28 11.2-39.2 0s-11.2-28 0-39.2l133.6-139.2c11.2-11.2 28-11.2 39.2 0l133.6 139.2c11.2 11.2 11.2 28 0 39.2 0 5.6-5.6 5.6-16.8 5.6z m178.4 340c-94.4 0-189.6-39.2-256-105.6C128 673.6 94.4 523.2 144.8 388.8c0-11.2 16.8-22.4 33.6-16.8 11.2 5.6 22.4 22.4 16.8 39.2-39.2 111.2-11.2 239.2 72 323.2 94.4 100 244.8 122.4 367.2 56 11.2-5.6 28 0 39.2 11.2 5.6 11.2 0 28-11.2 39.2-61.6 27.2-116.8 38.4-178.4 38.4z m373.6-222.4h-11.2c-16.8-5.6-22.4-22.4-16.8-33.6 39.2-111.2 11.2-239.2-72-323.2-94.4-94.4-244.8-122.4-367.2-56-11.2 5.6-28 0-39.2-11.2 0-22.4 5.6-39.2 16.8-44.8 139.2-77.6 317.6-50.4 434.4 67.2 100 100 128 250.4 83.2 384-6.4 6.4-16.8 17.6-28 17.6z" >
                </path>
              </svg>
            </li>
          </ul>
        `;
      },
      handleClick: (code, graph) => {
        codeActionMap[code](graph);
      },
      position: { x: 20, y: 20 },
    });

    //region Graph and events handlers
    this.graph = new G6.Graph({
      container: 'networkGraph',
      width,
      height,
      plugins: [grid, contextMenu, toolbar],
      groupByTypes: false,
      modes: {
        default: [
          {
            type: 'drag-combo',
            onlyChangeComboSize: true,
          },
          'drag-node',
          {
            type: 'drag-canvas',
            enableOptimize: true,
            onlyChangeComboSize: true,
          },
          {
            type: 'zoom-canvas',
            enableOptimize: true,
          },
        ],
      },

      layout: {
        type: 'fruchterman',
        workerEnabled: false,
        gpuEnabled: this.useGpu(),
        gravity: 6,
        clusterGravity: 4,
        clustering: true,
        maxIteration: this.useGpu() ? 10 : 1000,
      },
      animate: true,
      enabledStack: true,
      defaultCombo: {
        type: 'circle',
        labelCfg: {
          position: 'bottom',
          refX: 5,
          refY: 10,
          style: {
            fontSize: 9,
            // fill: "#ccc",
          },
        },
      },
      defaultNode: {
        type: 'markedNode',
        size: 30,
        style: {
          stroke: '#65B2FF',
        },
        labelCfg: {
          position: 'bottom',
          style: {
            fontSize: 8,
            // fill: '#ccc',
            opacity: 0.85,
          },
        },
        icon: {
          show: true,
          img: 'assets/img/icons/graph/container.svg',
        },
      },
      defaultEdge: {
        type: 'quadratic',
        labelCfg: {
          autoRotate: true,
          style: {
            fontSize: 8,
          },
        },
      },
      nodeStateStyles: {
        selected: {
          lineWidth: 3,
        },
        muted: { opacity: 0.2 },
        unMuted: { opacity: 0.3 },
      },
      edgeStateStyles: {
        active: {
          opacity: 1.0,
        },
        muted: { opacity: 0.1 },
        unMuted: { opacity: 0.3 },
      },
    });

    const toggleLabel = evt => {
      const { item } = evt;
      const model = item.getModel();
      const currentLabel = model.label;
      if (model.oriLabel !== currentLabel) {
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;
      }
      return item;
    };

    this.graph.on('node:mouseenter', evt => {
      const item = toggleLabel(evt);
      this.graph.setItemState(item, 'active', true);
      item.toFront();
    });

    this.graph.on('node:mouseleave', evt => {
      const item = toggleLabel(evt);
      this.graph.setItemState(item, 'active', false);
    });

    const addOrUpdateLink = (sourceId, targetId, edge, result) => {
      let theLink = this.graph.findById(`${sourceId}${targetId}`);
      if (!theLink) {
        addEdge(sourceId, targetId, edge);
        result.push(`${sourceId}${targetId}`);
      } else {
        let model = theLink.getModel();
        this.graphService.aggregateLinks(model, edge);
        theLink.update(model);
      }
    };

    const toggleNodeLinks = (item, comboId) => {
      const nodeId = item.getModel().id;
      let nodeLinks = this.nodeToClusterEdgesMap.get(nodeId);

      const findLinks = (edge, result, linkId, endName) => {
        const endpoint = this.graph.findById(edge[endName]);
        //target is inside combo, just add the link
        if (endpoint && endpoint.isVisible()) {
          this.graph.addItem('edge', edge);
          result.push(linkId);
        }
        // target is aggregated as group node
        else {
          const targetNode =
            this.serverData.nodes[
              this.graphService.getNodeIdIndexMap().get(edge[endName])
            ];
          if (targetNode) {
            const clusterId = targetNode.clusterId;
            if (
              this.graph.findById(clusterId) &&
              this.graph.findById(clusterId).isVisible()
            ) {
              if (endName === 'target')
                addOrUpdateLink(nodeId, clusterId, edge, result);
              else addOrUpdateLink(clusterId, nodeId, edge, result);
            } else {
              const domainId = targetNode.domain;
              if (
                this.graph.findById(domainId) &&
                this.graph.findById(domainId).isVisible()
              ) {
                if (endName === 'target')
                  addOrUpdateLink(nodeId, domainId, edge, result);
                else addOrUpdateLink(domainId, nodeId, edge, result);
              }
            }
          }
        }
      };

      if (!nodeLinks) {
        const nodeEdges = this.serverData.edges
          .filter(
            edge =>
              !(
                edge.fromGroup === item.getModel().clusterId &&
                edge.fromGroup === edge.toGroup
              ) &&
              (edge.source === nodeId || edge.target === nodeId)
          )
          .reduce((result, edge) => {
            let linkId = edge.id;
            this.graphService.formatEdge(edge);
            if (edge.source === nodeId) {
              findLinks(edge, result, linkId, 'target');
            } else if (edge.target === nodeId) {
              findLinks(edge, result, linkId, 'source');
            }
            return result;
          }, []);
        this.nodeToClusterEdgesMap.set(nodeId, nodeEdges);
        muteComboEdges(comboId);
        this.lastRevealedNodeIds.push(nodeId);
      } else {
        nodeLinks.forEach(linkId => {
          let link = this.graph.findById(linkId);
          if (link) {
            this.graph.removeItem(link);
          }
        });
        unmMuteComboEdges(comboId);
        this.lastRevealedNodeIds = [];
        this.nodeToClusterEdgesMap.delete(nodeId);
      }

      item.toFront();
    };

    const muteComboEdges = comboId => {
      const combo = this.graph.findById(comboId);
      if (combo) {
        // @ts-ignore
        let edges = combo.getEdges();
        edges.forEach(edge => {
          this.graph.setItemState(edge, 'unMuted', false);
          this.graph.setItemState(edge, 'muted', true);
        });
      }
    };

    const unmMuteComboEdges = comboId => {
      const combo = this.graph.findById(comboId);
      if (combo) {
        // @ts-ignore
        let edges = combo.getEdges();
        edges.forEach(edge => {
          this.graph.setItemState(edge.getModel().id, 'muted', false);
          this.graph.setItemState(edge.getModel().id, 'unMuted', true);
        });
      }
    };

    const showDomainInfo = item => {
      this.domain = item.getModel();
      this.popupState.leave();
      this.stopRefreshSession();

      setTimeout(() => {
        this.popupState.transitTo(PopupState.onDomain);
      }, 300);
    };

    const showHostInfo = id => {
      const startIndex = id.indexOf('Host:');

      this.popupState.leave();
      this.stopRefreshSession();
      this.hostId = startIndex >= 0 ? id.slice(startIndex + 5) : id;
      setTimeout(() => {
        this.popupState.transitTo(PopupState.onHost);
      }, 300);
    };

    const showGroupInfo = item => {
      this.groupId = item.getModel().clusterId || item.getModel().id;
      this.showGroup(this.groupId);
    };

    const showPodInfo = node => {
      let nodeId = node.meshId ? node.meshId : node.id;
      this.isPodInfoReady = false;
      this.assetsHttpService
        .getContainerBriefById(nodeId)
        .subscribe(workloadData => {
          this.pod.workload = workloadData['workload'];

          let theNode =
            this.serverData.nodes[
              this.graphService.getNodeIdIndexMap().get(nodeId)
            ];
          // @ts-ignore
          theNode.cve = this.graphService.getCveLevel(theNode);
          if (
            this.pod.workload.labels &&
            this.pod.workload.labels['io.kubernetes.container.name'] === 'POD'
          ) {
            this.pod.workload.images = [];
          } else {
            this.pod.workload.images = [workloadData.workload.image];
          }
          if (
            this.pod.workload.children &&
            this.pod.workload.children.length > 0
          ) {
            this.pod.workload.images = [];
            const images = this.pod.workload.images;
            this.pod.workload.children.forEach(function (child) {
              images.push(child.image);
            });
          }
          // @ts-ignore
          this.pod.risk = theNode.cve;
          this.isPodInfoReady = true;
        });
      setTimeout(() => {
        this.popupState.transitTo(PopupState.onNode);
        this.stopRefreshSession();
      }, 300);
    };

    const showNodeInfo = (node, item) => {
      if (node.kind === 'group') {
        showGroupInfo(item);
      } else if (node.group.startsWith('host')) showHostInfo(node.id);
      else if (
        node.group.startsWith('container') ||
        node.group.startsWith('mesh')
      ) {
        showPodInfo(node);
      } else if (node.kind === 'domain') {
        showDomainInfo(item);
      } else {
        this.popupState.leave();
        this.stopRefreshSession();
      }
    };

    const getNodeName = node => {
      if (node.label && !node.label.endsWith('...')) return node.label;
      else return node.oriLabel;
    };

    const hideNode = item => {
      const node = item.getModel();
      if (node.kind === 'group') {
        this.graph.hideItem(item);
        this.blacklist?.groups.push({
          name: node.id,
          displayName: getServiceName(node.id),
        });
      } else if (node.kind === 'domain') {
        this.graph.hideItem(item);
        this.blacklist?.domains.push({ name: node.id });
        if (this.collapsedDomains.has(node.id))
          this.collapsedDomains.delete(node.id);
      } else {
        this.graph.hideItem(item);
        this.blacklist?.endpoints.push({
          name: getNodeName(node),
          id: node.id,
        });
      }

      this.saveBlacklist(this.blacklist);
      // this.graph.layout();
    };

    const hideInComing = item => {
      const edges = item.getInEdges();
      edges.forEach(edge => {
        edge.hide();
        this.hiddenItemIds.push(edge.getModel().id);
      });
      this.inComingNodes.push(item.getModel().id);
    };

    const showInComing = item => {
      const edges = item.getInEdges();
      edges.forEach(edge => {
        edge.show();
        this.hiddenItemIds = this.hiddenItemIds.filter(
          edgeId => edgeId !== edge.getModel().id
        );
      });
      this.inComingNodes = this.inComingNodes.filter(
        nodeId => nodeId !== item.getModel().id
      );
    };

    const hideOutGoing = item => {
      const edges = item.getOutEdges();
      edges.forEach(edge => {
        edge.hide();
        this.hiddenItemIds.push(edge.getModel().id);
      });
      this.outGoingNodes.push(item.getModel().id);
    };

    const showOutGoing = item => {
      const edges = item.getOutEdges();
      edges.forEach(edge => {
        edge.show();
        this.hiddenItemIds = this.hiddenItemIds.filter(
          edgeId => edgeId !== edge.getModel().id
        );
      });
      this.outGoingNodes = this.outGoingNodes.filter(
        nodeId => nodeId !== item.getModel().id
      );
    };

    const isGroupEdge = edge =>
      edge.getSource().getModel().kind === 'group' ||
      edge.getSource().getType() === 'combo' ||
      edge.getTarget().getModel().kind === 'group' ||
      edge.getTarget().getType() === 'combo';

    const showEdgeDetail = edgeItem => {
      this.selectedEdge = edgeItem;
      this.edgeDetails = edgeItem.getModel();
      if (this.edgeDetails.kind === 'group' || isGroupEdge(edgeItem)) {
        this.graphService.keepLive();
        return;
      }

      let from = this.edgeDetails.source,
        to = this.edgeDetails.target;
      this.graphService.getConversations(from, to).subscribe(
        response => {
          this.conversationDetail = response['conversation'];
          this.popupState.leave();
          this.stopRefreshSession();
          this.showRuleId = false;
          if (this.conversationDetail.entries!.length > 0)
            this.entriesGridHeight = this.getGridHeight(
              this.conversationDetail.entries
            );
          this.popupState.transitTo(PopupState.onEdge);
        },
        err => {
          this.popupState.leave();
          this.stopRefreshSession();
          console.warn(err);
        }
      );
    };

    const showCve = (message, position) => {
      if (!this.tooltipEl) {
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.setAttribute('class', 'drop drop1');
        this.container!.appendChild(this.tooltipEl);
      }
      this.tooltipEl.textContent = message;
      this.tooltipEl.style.left = position.x + 'px';
      this.tooltipEl.style.top = position.y + 'px';
      this.tooltipEl.style.display = 'block';
    };

    const hideCve = () => {
      if (!this.tooltipEl) {
        return;
      }
      this.tooltipEl.style.display = 'none';
    };

    this.graph.on('node:click', evt => {
      const { item } = evt;
      // this.graph.setItemState(item, "selected", true);

      //Show CVE count
      let node = evt.item;
      let nodeMode = node?.get('model');
      let shape = evt.target;
      if (shape.get('name') === 'tag-circle') {
        showCve(
          'High: ' + nodeMode.cve.high + ' Medium: ' + nodeMode.cve.medium,
          {
            x: evt.canvasX,
            y: evt.canvasY,
          }
        );
      } else {
        hideCve();
      }

      //Reveal links for the selected node
      if (nodeMode.comboId) {
        if (nodeMode.meshId) return;
        if (
          this.lastRevealedNodeIds.length &&
          this.lastRevealedNodeIds[0] !== nodeMode.id
        ) {
          let lastItem = this.graph.findById(this.lastRevealedNodeIds[0]);
          if (lastItem) {
            toggleNodeLinks(lastItem, lastItem.getModel().comboId);
          }
        }
        toggleNodeLinks(item, nodeMode.comboId);
      }
      this.graphService.keepLive();
    });

    const addEdge = (sourceId, targetId, edge) => {
      const newEdge = Object.assign({}, edge);
      newEdge.id = `${sourceId}${targetId}`;
      newEdge.source = sourceId;
      newEdge.target = targetId;
      newEdge.members = [edge.id];
      newEdge.status = edge.status;
      newEdge.style = this.graphService.getEdgeStyle(
        edge,
        MapConstant.EDGE_STATUS_MAP[edge.status]
      );
      newEdge.label = '';
      newEdge.oriLabel = '';
      newEdge.weight = 1;
      if (edge.style.stroke !== MapConstant.EDGE_STATUS_MAP['OK'])
        newEdge.stateStyles = {
          active: {
            stroke: MapConstant.EDGE_STATUS_MAP[edge.status],
            opacity: 1.0,
          },
        };
      this.graph.addItem('edge', newEdge);
    };

    const aggregateStatus = links => {
      if (!links || links.length === 0) return 'OK';
      const status: Set<string> = new Set(
        links.map(edge => edge.getModel().status)
      );
      if (!status || status.size === 0) return 'OK';
      else {
        return [...status].reduce((acc, val) => {
          acc =
            MapConstant.EDGE_STATUS_LEVEL_MAP[val] >
            MapConstant.EDGE_STATUS_LEVEL_MAP[acc]
              ? val
              : acc;
          return acc;
        }, 'OK');
      }
    };

    const mergeLinks = (newEdge, links) => {
      newEdge.members = links.map(edge => edge.getModel().id);
      newEdge.status = aggregateStatus(links);
      newEdge.style = this.graphService.getEdgeStyle(
        newEdge,
        MapConstant.EDGE_STATUS_MAP[newEdge.status]
      );
      newEdge.label = '';
      newEdge.oriLabel = Array.from(newEdge.status).join(', ');
      this.graph.addItem('edge', newEdge);
      links.forEach(edge => {
        this.graph.removeItem(edge);
      });
    };

    const mergeRevealedLinks = item => {
      if (this.lastRevealedNodeIds.length === 0) return;
      const nodeId = this.lastRevealedNodeIds[0];
      const revealedNode = this.graph.findById(nodeId);
      if (
        !revealedNode ||
        revealedNode.getModel().comboId === item.getModel().id
      )
        return;
      // @ts-ignore
      const edges: any[] = revealedNode.getEdges();
      if (edges && edges.length > 0) {
        const revealedEdges = edges.filter(
          edge =>
            edge.getSource().getModel().comboId === item.getModel().id ||
            edge.getTarget().getModel().comboId === item.getModel().id
        );
        let sources: any[] = [],
          targets: any[] = [];
        revealedEdges.forEach(edge => {
          if (edge.getSource().getModel().comboId === item.getModel().id) {
            sources.push(edge);
          } else if (
            edge.getTarget().getModel().comboId === item.getModel().id
          ) {
            targets.push(edge);
          }
        });
        if (sources.length > 0) {
          let newEdge: any = {};
          newEdge.id = item.getModel().id.substring(2) + nodeId;
          newEdge.source = item.getModel().id.substring(2);
          newEdge.target = nodeId;
          newEdge.weight = sources.length;
          mergeLinks(newEdge, sources);
        }
        if (targets.length > 0) {
          let newEdge: any = {};
          newEdge.id = nodeId + item.getModel().id.substring(2);
          newEdge.source = nodeId;
          newEdge.target = item.getModel().id.substring(2);
          newEdge.weight = targets.length;
          mergeLinks(newEdge, targets);
        }
      }
    };

    const expand = item => {
      const model = item.getModel();
      if (model.kind === 'domain') expandDomain(item);
      else if (model.kind === 'group') this.expandCluster(item);
      // else if (model.kind === "mesh") expandMesh(item);
    };

    const GROUP_TO_ICON = {
      discover: 'cluster-d',
      monitor: 'cluster-m',
      protect: 'cluster-p',
    };

    const collapseCluster = item => {
      const clusterNode = this.graph.findById(item.getModel().id.substring(2));
      if (clusterNode.getModel().quarantines) {
        this.graph.updateItem(clusterNode, {
          style: {
            fill: '#ffcccb',
          },
        });
      } else {
        this.graph.updateItem(clusterNode, {
          style: {
            fill:
              // @ts-ignore
              this.graphService.fillColor[clusterNode.getModel().policyMode] ||
              '#EFF4FF',
          },
        });
      }
      // @ts-ignore
      const clusterEdges = clusterNode.getEdges();

      this.graph.showItem(clusterNode);

      let hiddenEdges = clusterEdges.filter(item => !item.isVisible());
      if (hiddenEdges && hiddenEdges.length > 0) {
        hiddenEdges.forEach(item => this.toggleLine(item));
      }

      mergeRevealedLinks(item);

      this.graph.removeItem(item);
      this.graph.paint();
    };

    const collapseDomain = item => {
      const domainModel = item.getModel();
      if (!domainModel.domain) return;

      const domainNode = this.graphService.nodeToDomain(domainModel);
      if (domainModel.x) {
        // @ts-ignore
        domainNode.x = domainModel.x + 30;
        // @ts-ignore
        domainNode.y = domainModel.y + 30;
      }

      this.collapseOnNode(domainModel.domain, domainNode);

      this.collapsedDomains.set(domainModel.domain, domainNode);
    };

    const expandDomain = item => {
      const domainModel = item.getModel();
      if (!domainModel.domain) return;

      this.graph.removeItem(item);
      this.data.nodes.forEach(node => {
        if (node.domain === domainModel.domain) {
          const item = this.graph.findById(node.id);
          item && this.graph.showItem(item);
        }
      });
      if (this.collapsedDomains.has(domainModel.domain))
        this.collapsedDomains.delete(domainModel.domain);
    };

    const getMeshLinks = (meshNode, sidecar, inCombo = false) => {
      const selfLink = this.graph.findById(`${meshNode.id}${meshNode.id}`);
      this.graph.hideItem(selfLink);

      const links = this.serverData.edges.filter(
        edge => edge.source === sidecar.id || edge.target === sidecar.id
      );

      if (links && links.length > 0) {
        links.forEach(
          link => ([link.source, link.target] = [link.target, link.source])
        );
      }

      if (links && links.length > 0) {
        links.forEach(link => {
          this.graphService.formatEdge(link);
          if (inCombo) {
            // @ts-ignore
            link.style.endArrow = {
              path: G6.Arrow.triangle(2, 3),
            };
          }
        });
      }
      return links;
    };

    const refreshDraggedNodePosition = e => {
      const model = e.item.get('model');
      model.fx = e.x;
      model.fy = e.y;
    };

    this.graph.on('node:dragstart', e => {
      // this.graph.layout();
      refreshDraggedNodePosition(e);
    });
    this.graph.on('node:drag', e => {
      refreshDraggedNodePosition(e);
    });

    this.graph.on('node:dblclick', evt => {
      const { item } = evt;
      hideCve();
      if (item?.getModel().kind === 'group') this.expandCluster(item);
      else if (item?.getModel().kind === 'domain') expandDomain(item);
      this.graphService.keepLive();
    });

    this.graph.on('combo:mouseenter', evt => {
      const item = toggleLabel(evt);
      this.graph.setItemState(item, 'active', true);
    });

    this.graph.on('combo:mouseleave', evt => {
      const item = toggleLabel(evt);
      this.graph.setItemState(item, 'active', false);
    });

    this.graph.on('edge:mouseenter', evt => {
      const item = toggleLabel(evt);
      this.graph.setItemState(item, 'active', true);
    });

    this.graph.on('edge:mouseleave', evt => {
      const item = toggleLabel(evt);
      this.graph.setItemState(item, 'active', false);
    });

    this.graph.on('edge:click', e => {
      const { item } = e;
      if (item) {
        this.graph.setItemState(item, 'active', true);
        showEdgeDetail(item);
      }
    });

    this.graph.on('combo:dblclick', e => {
      collapseCluster(e.item);
      this.graph.refreshPositions();
    });

    this.graph.on('canvas:click', () => {
      hideCve();
    });

    this.graph.on('canvas:dblclick', () => {
      autoZoom(this.graph);
    });

    this.graph.on('afterlayout', () => {
      setTimeout(() => {
        this.graph.refreshPositions();
        this.graph.fitView();
      }, 500);
    });

    //endregion
  }

  showGroup(groupName: string) {
    this.isGroupInfoReady = false;
    this.groupsService.getGroupInfo(groupName).subscribe(
      (response: any) => {
        this.group = response;
        this.isGroupInfoReady = true;
      },
      error => {
        this.popupState.leave();
        console.warn(error);
      }
    );

    setTimeout(() => {
      this.stopRefreshSession();
      this.popupState.transitTo(PopupState.onGroupNode);
    }, 300);
  }

  ngOnInit(): void {
    this._toggleSidebarSubscription =
      this.frameService.onSidebarCollapseEvent$.subscribe(data => {
        if (!this.graph || this.graph.get('destroyed')) return;
        if (
          !this.container ||
          !this.container.scrollWidth ||
          !this.container.clientHeight
        )
          return;
        this.graph.changeSize(
          this.w.innerWidth -
            (this.switchers.getFrameSwitcher('isCollapsed')
              ? this.SIDE_BAR_S
              : this.SIDE_BAR) -
            this.PADDING,
          this.w.innerHeight - this.TOP_BAR - this.PADDING
        );
        this.graph.fitView();
      });
    this.graphService.registerG6Components();
    this.domainGridOptions = this.graphService.prepareDomainGrid();
    this.initSettings();
    this.loadBlacklist();
    this.loadAdvFilters();
    this.isWriteNetworkAuthorized =
      this.authUtilsService.getDisplayFlag('write_network_rule');
    this.gpuEnabled = this.useGpu();

    this.container = document.getElementById('networkGraph');

    let height = this.w.innerHeight - this.TOP_BAR - this.PADDING;
    let width = this.w.innerWidth - this.SIDE_BAR - this.PADDING;

    this.prepareGraphics(height, width, this.isWriteNetworkAuthorized);

    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe(() => {
      if (!this.graph || this.graph.get('destroyed')) return;
      if (
        !this.container ||
        !this.container.scrollWidth ||
        !this.container.clientHeight
      )
        return;
      this.graph.changeSize(
        this.w.innerWidth -
          (this.switchers.getFrameSwitcher('isCollapsed')
            ? this.SIDE_BAR_S
            : this.SIDE_BAR) -
          this.PADDING,
        this.w.innerHeight - this.TOP_BAR - this.PADDING
      );
      this.graph.fitView();
    });

    if (this.graphService.advFilterApplied()) {
      const callback = () => {
        this.updateGraph(false);
      };
      this.loadGraph(true, callback);
    } else this.loadGraph();

    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        window.location.reload();
      });
  }

  private inHiddenDomain(node) {
    if (this.blacklist.domains?.length > 0) {
      return this.blacklist.domains.some(domain => domain.name === node.domain);
    } else return false;
  }

  private inHiddenGroup(node) {
    if (this.blacklist.groups?.length > 0) {
      return this.blacklist.groups.some(group => group.name === node.clusterId);
    } else return false;
  }

  private isHiddenEndpoint(node) {
    if (this.blacklist.endpoints?.length > 0) {
      return this.blacklist.endpoints.some(
        endpoint =>
          endpoint.name === node.label || endpoint.name === node.oriLabel
      );
    } else return false;
  }

  private readonly unmanagedEndpoints = ['node_ip', 'workload_ip'];

  private filterHiddenNodes(nodes) {
    return nodes.filter(
      node =>
        !this.inHiddenDomain(node) &&
        !this.inHiddenGroup(node) &&
        !this.isHiddenEndpoint(node) &&
        !(
          this.blacklist?.hideUnmanaged &&
          this.unmanagedEndpoints.includes(node.group)
        )
    );
  }

  private edgeWithHiddenDomain(edge) {
    if (this.blacklist === undefined) return false;
    if (this.blacklist.domains?.length > 0) {
      return this.blacklist.domains.some(
        domain =>
          domain.name === edge.fromDomain || domain.name === edge.toDomain
      );
    } else return false;
  }

  private edgeWithHiddenGroup(edge) {
    if (this.blacklist === undefined) return false;
    if (this.blacklist.groups?.length > 0) {
      return this.blacklist.groups.some(
        group => group.name === edge.fromGroup || group.name === edge.toGroup
      );
    } else return false;
  }

  private edgeWithHiddenEndpoint(edge) {
    if (this.blacklist === undefined) return false;
    if (this.blacklist.endpoints?.length > 0) {
      return this.blacklist.endpoints.some(
        endpoint => endpoint.id === edge.source || endpoint.id === edge.target
      );
    } else return false;
  }

  private readonly unmanagedDomains = [
    'nvUnmanagedWorkload',
    'nvUnmanagedNode',
  ];
  private edgeWithUnmanagedEndpoint(edge) {
    if (this.blacklist === undefined) return false;
    if (this.blacklist.hideUnmanaged) {
      return (
        this.unmanagedDomains.includes(edge.fromDomain) ||
        this.unmanagedDomains.includes(edge.toDomain)
      );
    } else return false;
  }
  private filterHiddenEdges(edges) {
    return edges.filter(
      edge =>
        !this.edgeWithHiddenDomain(edge) &&
        !this.edgeWithHiddenGroup(edge) &&
        !this.edgeWithHiddenEndpoint(edge) &&
        !this.edgeWithUnmanagedEndpoint(edge)
    );
  }

  loadGraph(onRefresh: boolean = true, callback?: () => void) {
    this.graphService.getNetworkData(this.user).subscribe(response => {
      if (!this.blacklist) {
        this.blacklist = response.blacklist
          ? response.blacklist
          : this.graphService.getBlacklist();
      }
      this.localStorage.set(
        `${this.user}-blacklist`,
        JSON.stringify(this.blacklist)
      );

      this.localStorage.set(
        '_gpuEnabled',
        JSON.stringify(response.enableGPU || false)
      );

      this.gpuEnabled = this.useGpu();

      this.data.nodes = this.filterHiddenNodes(response.nodes);
      this.data.edges = this.filterHiddenEdges(response.edges);
      this.serverData = JSON.parse(
        JSON.stringify({ nodes: response.nodes, edges: response.edges })
      );
      this.serverData.nodes.forEach(node => {
        node.cve = this.graphService.getCveLevel(node);
      });

      this.data.nodes = this.graphService.processNodes(
        this.data.nodes,
        this.data,
        true,
        this.settings
      );
      this.data.edges = this.graphService.processEdges(
        this.serverData,
        response.edges,
        true,
        this.settings
      );

      if (onRefresh) {
        // @ts-ignore
        this.graph.data(this.data);
        // this.graph.set('animate', false);
        this.graph.render();
      }
      // @ts-ignore
      else this.graph.changeData(this.data);

      if (callback) callback();
    });
  }

  private getRiskyNodes(clusterId) {
    const riskySourceLinks = this.serverData.edges.filter(
      edge =>
        edge.fromGroup === clusterId &&
        this.RISKY_STATUSES.includes(edge.status)
    );
    const riskyTargetLinks = this.serverData.edges.filter(
      edge =>
        clusterId === edge.toGroup && this.RISKY_STATUSES.includes(edge.status)
    );
    const sources = riskySourceLinks.map(link => link.source);
    const targets = riskyTargetLinks.map(link => link.target);
    return [...new Set([...sources, ...targets])];
  }

  private addMissingEdge(sourceId, targetId, edge) {
    const newEdge = {
      id: `${sourceId}${targetId}`,
      source: sourceId,
      target: targetId,
      style: edge.getModel().style,
      // label: edge.label,
    };
    if (edge.getModel().style.stroke !== MapConstant.EDGE_STATUS_MAP['OK']) {
      // @ts-ignore
      newEdge.stateStyles = {
        active: {
          stroke: MapConstant.EDGE_STATUS_MAP[edge.getModel().status],
          opacity: 1.0,
        },
      };
    }
    if (!this.graph.findById(`${sourceId}${targetId}`))
      this.graph.addItem('edge', newEdge);
  }

  private toggleLine(edge) {
    if (!edge.getSource().isVisible()) {
      if (edge.getSource().getType() === 'combo') {
        this.addMissingEdge(
          `${edge.getSource().getModel().id.substring(2)}`,
          `${edge.getTarget().getModel().id}`,
          edge
        );
      } else {
        this.addMissingEdge(
          `co${edge.getSource().getModel().id}`,
          `${edge.getTarget().getModel().id}`,
          edge
        );
      }
    }
    if (!edge.getTarget().isVisible()) {
      if (edge.getTarget().getType() === 'combo') {
        this.addMissingEdge(
          `${edge.getSource().getModel().id}`,
          `${edge.getTarget().getModel().id.substring(2)}`,
          edge
        );
      } else {
        this.addMissingEdge(
          `${edge.getSource().getModel().id}`,
          `co${edge.getTarget().getModel().id}`,
          edge
        );
      }
    }
  }

  private doSubLayout(clusterNode, clusterNodes) {
    // noinspection JSPotentiallyInvalidConstructorUsage
    const subLayout = new G6.Layout.concentric({
      center: [clusterNode.x, clusterNode.y],
      preventOverlap: true,
      nodeSize: 15,
      minNodeSpacing: 15,
      maxLevelDiff: 10,
      sortBy: 'index',
      tick: () => {
        this.graph.refreshPositions();
      },
    });
    subLayout.init({
      nodes: clusterNodes,
      edges: [],
    });
    subLayout.execute();

    //Lock all the combo members inside combo
    clusterNodes.forEach(item => {
      const node = this.graph.findById(item.id);
      // @ts-ignore
      node.lock();
    });
  }

  private revealLinks(item) {
    if (this.lastRevealedNodeIds.length === 0) return;
    const nodeId = this.lastRevealedNodeIds[0];
    const node = this.graph.findById(nodeId);
    // @ts-ignore
    const edges = node && node.getEdges();
    if (edges && edges.length > 0) {
      const mergedEdges = edges.filter(
        edge =>
          edge.getSource().getModel().id === item.getModel().id ||
          edge.getTarget().getModel().id === item.getModel().id
      );
      if (mergedEdges && mergedEdges.length > 0) {
        mergedEdges.forEach(edge => {
          const members = edge.getModel().members;
          if (members && members.length > 0) {
            members.forEach(member => {
              const memberEdge =
                this.serverData.edges[
                  this.graphService.getEdgeIdIndexMap().get(member)
                ];
              const edge = Object.assign({}, memberEdge);
              this.graphService.formatEdge(edge);

              // @ts-ignore
              if (edge.style.stroke !== MapConstant.EDGE_STATUS_MAP['OK']) {
                // @ts-ignore
                edge.stateStyles = {
                  active: {
                    stroke: MapConstant.EDGE_STATUS_MAP[edge.status],
                    opacity: 1.0,
                  },
                };
              }

              if (edge) {
                // @ts-ignore
                this.graph.addItem('edge', edge);
              }
            });
          }
          this.graph.removeItem(edge);
        });
      }
    }
  }

  expandCluster(item) {
    const clusterNode = item.getModel();

    // const edges = data.edges;
    let clusterNodes: any[] = [];
    let clusterEdges: any[] = [];

    let selectedMode = clusterNode.policyMode || 'discover';

    const riskyNodes = this.getRiskyNodes(clusterNode.id);

    //add the cluster members
    let cluster = this.graphService.getClusterMap().get(clusterNode.id);
    if (cluster.comboCreated) {
      //show combo
      const comboNode = this.graph.findById(`co${clusterNode.id}`);
      // @ts-ignore
      const comboEdges = comboNode.getEdges();
      this.graph.showItem(comboNode);

      let hiddenEdges = comboEdges.filter(item => !item.isVisible());

      if (hiddenEdges && hiddenEdges.length > 0)
        hiddenEdges.forEach(item => this.toggleLine(item));

      this.graph.paint();
      comboNode.toFront();
      // @ts-ignore
      const children = comboNode.getNodes();
      children.forEach(child => child.toFront());
    } else {
      const members = cluster.members;
      if (members && members.length > 0) {
        clusterNodes = members.map(member => {
          const memberNode = this.serverData.nodes.find(
            node => node.id === member
          );
          // @ts-ignore
          memberNode.comboId = `co${clusterNode.id}`;
          const theNode = Object.assign({}, memberNode);
          // @ts-ignore
          theNode.cve = this.graphService.getCveLevel(theNode);
          this.graphService.formatNode(theNode);
          theNode.label = '';
          return theNode;
        });
      }

      // @ts-ignore
      clusterEdges = this.serverData.edges.filter(
        edge =>
          edge.fromGroup === edge.toGroup && edge.fromGroup === clusterNode.id
      );

      clusterNodes.forEach((item, i) => {
        let oldNode = this.graph.findById(item.id);
        if (oldNode) {
          this.graph.removeItem(oldNode);
        }

        item.index = i + 1;
        item.size = item.service_mesh ? 40 : 20;
        item.icon.width = item.service_mesh ? 30 : 13;
        item.icon.height = item.service_mesh ? 30 : 13;

        let nodeType = '';
        if (item.group && item.group.startsWith('container')) {
          nodeType = 'container';
        }
        if (item.group && item.group.startsWith('mesh')) {
          nodeType = 'mesh';
        }
        if (item.group && item.group.startsWith('host')) {
          nodeType = 'host';
        }
        if (item.kind && item.kind === 'group') {
          nodeType = 'group';
        }

        if (nodeType === 'container' || nodeType === 'mesh') {
          if (item.state !== 'unmanaged') {
            item.icon.img =
              nodeType === 'container'
                ? `assets/img/icons/graph/${
                    this.CONTAINER_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`
                : `assets/img/icons/graph/${
                    this.SERVICE_MESH_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`;
            item.style.stroke = this.graphService.strokeColor[selectedMode];
            item.style.fill = this.graphService.fillColor[selectedMode];
          }
        }

        if (nodeType === 'host') {
          if (item.state === 'unmanaged')
            item.icon.img = `assets/img/icons/graph/host.svg`;
          else
            item.icon.img = `assets/img/icons/graph/${
              this.HOST_TO_ICON[selectedMode.toLowerCase()]
            }.svg`;
          item.style.stroke = this.graphService.strokeColor[selectedMode];
          item.style.fill = this.graphService.fillColor[selectedMode];
        }

        if (riskyNodes && riskyNodes.length > 0) {
          if (riskyNodes.includes(item.id)) {
            item.style.stroke = '#ff9800';
            item.style.fill = '#d9b886';
          }
        }
        this.graph.addItem('node', item);
      });

      clusterEdges.forEach(edge => {
        this.graphService.formatEdge(edge);
        if (edge.source === edge.target) {
          edge.type = 'loop';
          edge.loopCfg = {
            dist: 20,
          };
          const loopNode =
            this.serverData.nodes[
              this.graphService.getNodeIdIndexMap().get(edge.source)
            ];
          if (loopNode && loopNode.service_mesh) {
            edge.style.stroke = '#9FB8AD';
            edge.style.opacity = 0.8;
          }
        }
        edge.style.endArrow = {
          path: G6.Arrow.triangle(2, 3),
        };
        if (
          this.graph.findById(edge.source) &&
          this.graph.findById(edge.target)
        )
          this.graph.addItem('edge', edge);
      });

      this.doSubLayout(clusterNode, clusterNodes);

      this.graph.createCombo(
        {
          id: `co${clusterNode.id}`,
          oriLabel: clusterNode.label,
          label: clusterNode.oriLabel,
          domain: clusterNode.domain,
          padding: 5,
        },
        members
      );
      const theCombo = this.graph.findById(`co${clusterNode.id}`);
      theCombo.toFront();
      members.forEach(member => {
        const theMember = this.graph.findById(member);
        theMember.toFront();
      });

      let oldEdges = item.getEdges();

      oldEdges.forEach(edge => {
        if (
          edge.getSource().getModel().id === clusterNode.id &&
          edge.getTarget().getModel().id === clusterNode.id
        )
          return;
        if (edge.getSource().getModel().id === clusterNode.id) {
          if (edge.getTarget().isVisible()) {
            this.addMissingEdge(
              `co${clusterNode.id}`,
              edge.getTarget().getModel().id,
              edge
            );
          }
        }
        if (edge.getTarget().getModel().id === clusterNode.id) {
          if (edge.getSource().isVisible()) {
            this.addMissingEdge(
              edge.getSource().getModel().id,
              `co${clusterNode.id}`,
              edge
            );
          }
        }
      });
    }
    this.graph.hideItem(clusterNode.id);
    this.revealLinks(item);

    this.graph.refreshPositions();
    this.graph.refresh();
    this.graph.paint();
  }

  doFocus(name) {
    const highlightNode = node => {
      this.graph.focusItem(node);
      this.graph.setItemState(node, 'selected', true);
      setTimeout(() => {
        // this.graph.zoom(1.5);
        this.graph.setItemState(node, 'selected', false);
      }, 4000);
    };

    //Search service by id, like nv.frontend.default
    const serviceNode = this.graph.findById(name);
    if (serviceNode) {
      highlightNode(serviceNode);
    }

    //Search pod by name/label
    else {
      const maybeNode = this.serverData.nodes.find(
        // @ts-ignore
        node => node.label === name || node.oriLabel === name
      );
      if (!maybeNode) return;

      const node = this.graph.findById(maybeNode.id);

      if (node) {
        highlightNode(node);
      } else {
        const groupNode = this.graph.findById(maybeNode.clusterId);
        if (groupNode) {
          this.expandCluster(groupNode);
          const insider = this.graph.findById(maybeNode.id);
          highlightNode(insider);
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
    if (this._toggleSidebarSubscription) {
      this._toggleSidebarSubscription.unsubscribe();
    }
  }

  //region Active Session
  showSessions(container) {
    this.containerId = container.id;
    this.currentNodeName =
      container.label.length > container.oriLabel.length
        ? container.label
        : container.oriLabel;
    this.popupState.leave();
    this.conversations = [];

    this.stopRefreshSession();
    this.refreshSession();
  }

  refreshSession() {
    if (this.autoRefresh) {
      this.getLiveSession();
    } else {
      this.getCurrentSession();
    }
  }

  private getGridHeight(items: Array<any>): number {
    let result: number;

    if (items.length <= 2) result = 40 + 30 * 2;
    else if (items.length < 5) result = 40 + 30 * items.length;
    else result = 40 + 30 * 5 + 8;

    return result;
  }

  private getActiveSessions(response) {
    this.conversations = response['sessions'];
    if (this.conversations && this.conversations.length > 0) {
      this.activeSessionGridHeight = this.getGridHeight(this.conversations);
      this.activeSessionGridOptions =
        this.graphService.prepareActiveSessionGrid();
    }
    this.popupState.transitTo(PopupState.onActiveSession);
  }

  private getCurrentSession() {
    this.graphService.getCurrentSession(this.containerId).subscribe(
      response => {
        this.getActiveSessions(response);
      },
      err => console.warn(err)
    );
  }

  subscription: Subscription | undefined;
  refreshTimer$;

  private getLiveSession() {
    this.refreshTimer$ = interval(5000);
    this.subscription = this.refreshTimer$.subscribe(
      this.getCurrentSession.bind(this)
    );
  }

  private stopRefreshSession() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.autoRefresh = false;
  }

  toggleRefresh(autoUpdate) {
    if (autoUpdate === this.autoRefresh) return;
    this.autoRefresh = autoUpdate;

    if (autoUpdate) this.refreshSession();
    else this.stopRefreshSession();
  }

  //endregion

  quarantine(item, toQuarantine: boolean) {
    const id: string = item.getModel().id;

    const message = toQuarantine
      ? this.translate.instant('policy.QUARANTINE_CONFIRM')
      : this.translate.instant('policy.UNQUARANTINE_CONFIRM');

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: message,
        isSync: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.graphService.quarantine(id, toQuarantine).subscribe(
          () => {
            setTimeout(() => {
              const model = item.getModel();
              if (toQuarantine) {
                model.state = 'quarantined';
                const theNode =
                  this.serverData.nodes[
                    this.graphService.getNodeIdIndexMap().get(model.id)
                  ];
                if (theNode) theNode.state = model.state;
                const group = item.get('group');
                const stroke = group.find(
                  e => e.get('name') === 'stroke-shape'
                );
                stroke && stroke.show();

                const clusterNode = this.graph.findById(model.clusterId);
                if (clusterNode) {
                  // @ts-ignore
                  clusterNode.getModel().quarantines += 1;
                }
              } else {
                const group = item.get('group');
                const stroke = group.find(
                  e => e.get('name') === 'stroke-shape'
                );
                stroke && stroke.hide();

                model.state = model.group
                  ? item.getModel().group.substring('container'.length)
                  : '';
                const theNode =
                  this.serverData.nodes[
                    this.graphService.getNodeIdIndexMap().get(model.id)
                  ];
                if (theNode) theNode.state = model.state;

                const clusterNode = this.graph.findById(model.clusterId);
                if (clusterNode) {
                  // @ts-ignore
                  clusterNode.getModel().quarantines -= 1;
                }
              }
            }, 0);
          },
          err => {
            console.warn(err);
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                err,
                this.translate.instant('policy.message.QUARANTINE_FAILED'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
      }
    });
  }

  //region Sniffer
  snifferOnErr: boolean = false;
  snifferErrMsg: string = '';

  options: Options = {
    floor: 0,
    ceil: 10,
    step: 1,
    showTicks: true,
  };

  showSniffer(container) {
    if (container && container.cap_sniff) {
      this.containerId = container.id;
      this.containerName =
        container.label.length > container.oriLabel.length
          ? container.label
          : container.oriLabel;
      this.popupState.leave();
      this.stopRefreshSession();

      this.sniffService.getSniffers(this.containerId).subscribe(
        response => {
          this.sniffers = response['sniffers'];
          this.sniffer = null;
          this.snifferGridHeight = 30 + 29 * 5 + 8;
          this.popupState.transitTo(PopupState.onSniffer);
        },
        err => {
          console.warn(err);
        }
      );
    }
  }

  //endregion

  private saveBlacklist(blacklist) {
    this.blacklist = blacklist;
    this.localStorage.set(`${this.user}-blacklist`, JSON.stringify(blacklist));
    this.graphService.saveBlacklist(this.user, blacklist);
  }

  saveSettings() {
    if (this.settings.persistent) {
      this.localStorage.set(
        `${this.user}-showSysApp`,
        JSON.stringify(this.settings.showSysApp)
      );

      this.localStorage.set(
        `${this.user}-showSysNode`,
        JSON.stringify(this.settings.showSysNode)
      );

      this.localStorage.set(
        `${this.user}-persistent`,
        JSON.stringify(this.settings.persistent)
      );

      this.localStorage.set(
        `${this.user}-advFilter`,
        JSON.stringify(this.advFilter)
      );
    }
  }

  clearSettings() {
    this.localStorage.remove(`${this.user}-showSysApp`);

    this.localStorage.remove(`${this.user}-showSysNode`);

    this.localStorage.remove(`${this.user}-persistent`);

    this.localStorage.remove(`${this.user}-advFilter`);
  }

  applyBlacklist(blacklist) {
    this.graphService.setBlacklist(blacklist);
    this.saveBlacklist(blacklist);

    setTimeout(() => {
      this.popupState.leave();
    }, 100);
    this.refresh();
  }

  resetBlacklist() {
    this.graphService.initBlacklist();
    this.blacklist = this.graphService.getBlacklist();
    this.graphService.saveBlacklist(this.user, this.blacklist);
    this.refresh();
  }

  applyAdvFilter(graphSettings: GraphSettings) {
    this.advFilter = graphSettings.advFilter;
    this.graphService.setAdvFilter(graphSettings.advFilter);
    const showLegend = this.settings.showLegend;
    this.settings = graphSettings.settings;
    this.settings.showLegend = showLegend;
    if (this.settings.persistent) this.saveSettings();
    else this.clearSettings();
    this.popupState.leave();
    if (
      this.settings.gpuEnabled !== null &&
      this.settings.gpuEnabled !== this.gpuEnabled
    ) {
      this.localStorage.set(
        '_gpuEnabled',
        JSON.stringify(this.settings.gpuEnabled)
      );
      this.gpuEnabled = this.settings.gpuEnabled;
      this.graph.updateLayout({
        gpuEnabled: this.gpuEnabled,
      });
    }

    if (this.graphService.advFilterApplied()) {
      this.handleCollapsedDomains();
    } else this.refresh();
  }

  resetAdvFilter() {
    this.graphService.initAdvFilter();
    this.advFilter = this.graphService.getAdvFilter();
    this.settings = {
      gpuEnabled: false,
      showSysNode: false,
      showSysApp: false,
      showLegend: false,
      hiddenDomains: [],
      hiddenGroups: [],
      persistent: false,
    };
    this.clearSettings();
    this.refresh();
    this.popupState.leave();
  }

  refresh() {
    if (this.popupState.onActiveSession()) this.stopRefreshSession();

    this.popupState.leave();

    if (this.graph) this.graph.clear();

    const callback = () => {
      if (this.graphService.advFilterApplied()) {
        this.handleCollapsedDomains();
      } else {
        if (this.collapsedDomains.size)
          [...this.collapsedDomains.values()].forEach(domainNode =>
            this.collapseOnNode(domainNode.id, domainNode)
          );
      }
    };
    this.loadGraph(false, callback);
  }

  collapseOnNode(domainName, domainNode) {
    const domainData = this.graphService.collapseDomain(
      this.data,
      domainName,
      this.collapsedDomains
    );
    if (domainData.nodes && domainData.nodes.length > 0) {
      let childrenInfo: any[] = [];
      domainData.nodes.forEach(node => {
        const item = this.graph.findById(node.id);
        let model = item.getModel();
        if (model) childrenInfo.push(model);
        if (item) {
          if (item.isVisible()) this.graph.hideItem(item);
          else {
            const combo = this.graph.findById(`co${node.id}`);
            combo && this.graph.removeItem(combo);
          }
        }
      });
      Object.assign(domainNode, { children: childrenInfo });
    }
    this.graph.addItem('node', domainNode);
    if (domainData.edges && domainData.edges.length > 0)
      domainData.edges.forEach(edge => this.graph.addItem('edge', edge));
  }

  private updateGraph(onRefresh: boolean) {
    const filteredData = this.graphService.applyAdvFilter(
      this.serverData,
      this.advFilter
    );

    this.data.nodes = this.graphService.processNodes(
      [...filteredData.nodes, ...filteredData.firstLevelNodes],
      this.serverData,
      onRefresh,
      this.settings
    );

    this.data.edges = this.graphService.processEdges(
      this.serverData,
      filteredData.edges,
      onRefresh,
      this.settings
    );

    // @ts-ignore
    this.graph.changeData(this.data);

    const filteredDomains = new Set(
      filteredData.nodes.map(node => node.domain)
    );

    const firstLevelDomains = new Set();

    const insert = (name, index, string) => {
      let ind = index < 0 ? name.length + index : index;
      return name.substring(0, ind) + string + name.substring(ind);
    };

    if (filteredData.firstLevelNodes.length > 0) {
      filteredData.firstLevelNodes.forEach(node => {
        firstLevelDomains.add(node.domain);
        const levelNode = this.graph.findById(node.id);

        if (levelNode) {
          // @ts-ignore
          const imgName = levelNode.getModel().icon.img;

          this.graph.setItemState(levelNode, 'muted', true);
          this.graph.updateItem(levelNode, {
            icon: {
              img: insert(imgName, -4, '_'),
            },
          });
        } else {
          const clusterNode = this.graph.findById(node.clusterId);
          if (clusterNode) {
            // @ts-ignore
            const imgName = clusterNode.getModel().icon.img;

            if (imgName.endsWith('_.svg')) return;
            // this.graph.setItemState(clusterNode, "muted", true);
            this.graph.updateItem(clusterNode, {
              style: {
                opacity: 0.2,
              },
              icon: {
                img: insert(imgName, -4, '_'),
              },
            });
          }
        }
      });
    }

    return {
      filteredDomains: filteredDomains,
      firstLevelDomains: firstLevelDomains,
    };
  }

  private handleCollapsedDomains() {
    const { filteredDomains, firstLevelDomains } = this.updateGraph(false);
    if (this.collapsedDomains.size)
      [...this.collapsedDomains.values()].forEach(domainNode => {
        if (firstLevelDomains.has(domainNode.id)) {
          this.collapseOnNode(domainNode.id, domainNode);
          const domainItem = this.graph.findById(domainNode.id);
          if (domainItem) {
            this.graph.setItemState(domainItem, 'muted', true);
          }
        }
        if (filteredDomains.has(domainNode.id))
          this.collapseOnNode(domainNode.id, domainNode);
      });
  }

  clearSessions = (conversationPair: ConversationPair) => {
    this.graphService
      .clearSessions(conversationPair.from, conversationPair.to)
      .subscribe(
        () => {
          //Remove displayed edge without data reloading
          this.graph.removeItem(this.selectedEdge);

          //Remove original edge in group without data reloading
          let removedEdgeIndex = this.serverData.edges.findIndex(edge => {
            return (
              edge.source === conversationPair.from &&
              edge.target === conversationPair.to
            );
          });
          if (removedEdgeIndex > -1) {
            this.serverData.edges.splice(removedEdgeIndex, 1);
          }

          this.popupState.leave();
        },
        err => {
          console.warn(err);
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('network.popup.SESSION_CLEAR_FAILURE'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
  };
}
