import { Injectable, SecurityContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ColDef, GetRowIdParams, GridOptions } from 'ag-grid-community';
import { DomSanitizer } from '@angular/platform-browser';
import {
  GraphData,
  GraphDataSet,
} from '@common/types/network-activities/graphData';
import { Observable, timer } from 'rxjs';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { BytesPipe } from '@common/pipes/app.pipes';
import {
  delayWhen,
  map,
  retryWhen,
  shareReplay,
  take,
  tap,
} from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import G6 from '@antv/g6';
import { isArray, isNumber } from '@antv/util';
import * as moment from 'moment';
import {
  AdvancedFilter,
  PolicyMode,
  Protocol,
} from '@common/types/network-activities/advancedFilter';
import { Blacklist } from '@common/types/network-activities/blacklist';
import { ClientIpCellComponent } from './client-ip-cell/client-ip-cell.component';
import { ServerIpCellComponent } from './server-ip-cell/server-ip-cell.component';
import { GlobalConstant } from '@common/constants/global.constant';

@Injectable()
export class GraphService {
  //Todo: define domain and group type to replace any
  _domains: any[] = [];
  _groups: any[] = [];
  _domainMap = new Map();
  _clusterMap = new Map();
  filteredDomainMap = new Map();
  filteredClusterMap = new Map();
  _nodeIdIndexMap = new Map();
  _edgeIdIndexMap = new Map();
  linkedNodeSet = new Set();
  advFilter: AdvancedFilter = <AdvancedFilter>{};
  blacklist = {
    domains: [],
    groups: [],
    endpoints: [],
    hideUnmanaged: false,
  };
  public strokeColor = {
    Protect: '#3E6545',
    Monitor: '#4E39C1',
    Discover: '#65B2FF',
  };
  public fillColor = {
    Protect: '#a3bba5',
    Monitor: '#b7a7f0',
    Discover: '#EFF4FF',
  };
  private readonly $win;
  private _dataSet: GraphData = { edges: [], nodes: [], enableGPU: false };
  private readonly oneMillion = 1000 * 1000;
  private readonly cveColors = {
    high: { fill: '#fa184a', stroke: '#f76987' },
    medium: { fill: '#ff9800', stroke: '#ffbc3e' },
  };
  private readonly groupToIconType = {
    container: 'container',
    containerDiscover: 'container-d',
    containerMonitor: 'container-m',
    containerProtect: 'container-p',
    containerUnmanaged: 'container-x',
    mesh: 'serviceMesh',
    meshDiscover: 'serviceMesh-d',
    meshMonitor: 'serviceMesh-m',
    meshProtect: 'serviceMesh-p',
    ip_service: 'service',
    address: 'address',
    node_ip: 'host',
    host: 'host',
    hostDiscover: 'host-d',
    hostMonitor: 'host-m',
    hostProtect: 'host-p',
    hostUnmanaged: 'host',
    workload_ip: 'container-x',
    meshProxy: 'meshProxy',
    external: 'cloud',
  };
  private readonly domainSizeMap = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];

  constructor(
    private utils: UtilsService,
    private bytesPipe: BytesPipe,
    private datePipe: DatePipe,
    private http: HttpClient,
    private translate: TranslateService,
    private sanitizer: DomSanitizer
  ) {
    this.$win = $(GlobalVariable.window);
    this.initAdvFilter();
  }

  initAdvFilter = () => {
    this.advFilter = {
      domains: [],
      groups: [],
      policyMode: {
        discover: true,
        monitor: true,
        protect: true,
      },
      cve: 'all',
      protocol: {
        tcp: true,
        udp: true,
        icmp: true,
      },
      risk: 'all',
    };
  };

  transformDate(value) {
    const date = new Date(value * 1000);
    return this.datePipe.transform(date, 'MMM dd, y HH:mm:ss');
  }

  advFilterApplied = () => {
    return (
      this.advFilter.domains.length > 0 ||
      this.advFilter.groups.length > 0 ||
      this.advFilter.cve !== 'all' ||
      this.advFilter.risk !== 'all' ||
      !this.advFilter.policyMode.discover ||
      !this.advFilter.policyMode.monitor ||
      !this.advFilter.policyMode.protect ||
      !this.advFilter.protocol.tcp ||
      !this.advFilter.protocol.udp ||
      !this.advFilter.protocol.icmp
    );
  };

  getAdvFilter = () => this.advFilter;

  setAdvFilter = filter => {
    this.advFilter = filter;
  };

  getBlacklist = () => this.blacklist;

  setBlacklist = bl => {
    this.blacklist.domains = bl.domains;
    this.blacklist.groups = bl.groups;
    this.blacklist.endpoints = bl.endpoints;
    this.blacklist.hideUnmanaged = bl.hideUnmanaged;
  };

  initBlacklist = () => {
    this.blacklist.domains = [];
    this.blacklist.groups = [];
    this.blacklist.endpoints = [];
    this.blacklist.hideUnmanaged = false;
  };

  getNetworkData: (user) => Observable<GraphData> = user =>
    this.http
      .get<GraphData>(PathConstant.NETWORK_INFO_URL, { params: { user: user } })
      .pipe(
        tap(() => console.log('Getting network activity data ...')),
        map(res => {
          this._dataSet = res;
          //todo: manipulate dataset
          return this._dataSet;
        }),
        shareReplay(),
        retryWhen(errors => {
          // noinspection JSDeprecatedSymbols
          return errors.pipe(
            delayWhen(() => timer(1000)),
            take(5),
            tap(() => console.log('retrying...'))
          );
        })
      );

  getConversations = (from, to) =>
    this.http
      .get(PathConstant.CONVERSATION_HISTORY_URL, {
        params: {
          from: encodeURIComponent(from),
          to: encodeURIComponent(to),
        },
      })
      .pipe();

  getIpMap = ipList => this.http.patch(PathConstant.IP_GEO_URL, ipList).pipe();

  getWorkload = workloadId =>
    this.http
      .get(PathConstant.CONTAINER_URL, {
        params: {
          id: workloadId,
        },
      })
      .pipe();

  getGroup = groupName =>
    this.http
      .get(PathConstant.GROUP_URL, {
        params: {
          name: groupName,
        },
      })
      .pipe();

  switchServiceMode = (mode, serviceGroup) =>
    this.http
      .patch(PathConstant.SERVICE_URL, {
        config: {
          services: [
            serviceGroup.indexOf('nv.') >= 0
              ? serviceGroup.substring(3)
              : serviceGroup,
          ],
          policy_mode: mode,
        },
      })
      .pipe();

  getCurrentSession = containerId =>
    this.http
      .get(PathConstant.SESSION_URL, { params: { id: containerId } })
      .pipe();

  clearSessions = (from: string, to: string) =>
    this.http
      .delete(PathConstant.CONVERSATION_SNAPSHOT_URL, {
        params: { from: encodeURIComponent(from), to: encodeURIComponent(to) },
      })
      .pipe();

  registerG6Components = () => {
    G6.registerNode(
      'markedNode',
      {
        afterDraw: (cfg, group) => {
          if (cfg !== undefined && group !== undefined) {
            let width = 0,
              height = 0;
            if (isNumber(cfg.size)) {
              width = cfg.size + 3;
              height = cfg.size / 2 + 2;
            }
            if (isArray(cfg.size)) {
              width = cfg.size[0] + 3;
              height = cfg.size[0] / 2 + 2;
            }

            const radius = cfg.kind === 'group' ? 5 : 4;
            // @ts-ignore
            const colorSet = cfg.cve ? this.cveColors[cfg.cve.level] : null;
            if (colorSet) {
              group.addShape('circle', {
                attrs: {
                  x: width / 2 - 3,
                  y: -height / 2 + 3,
                  r: radius,
                  fill: colorSet.fill,
                  lineWidth: 0.5,
                  cursor: 'pointer',
                  stroke: colorSet.stroke,
                },
                name: 'tag-circle',
              });
            }

            let r = 30;
            if (isNumber(cfg.size)) {
              r = cfg.size / 2;
            } else if (isArray(cfg.size)) {
              r = cfg.size[0] / 2;
            }
            const style = cfg.style;
            group.addShape('circle', {
              attrs: {
                x: 0,
                y: 0,
                r: r + 5,
                fill: style!.fill,
                fillOpacity: 0.1,
                stroke: '#f76987',
                strokeOpacity: 0.85,
                lineWidth: 1,
              },
              name: 'stroke-shape',
              visible: false,
            });

            if (cfg.state === 'quarantined') {
              const stroke = group.find(e => e.get('name') === 'stroke-shape');
              stroke && stroke.show();
            }
          }
        },
      },
      'circle'
    );

    G6.registerEdge(
      'circle-running',
      {
        afterDraw(cfg, group) {
          const shape = group!.get('children')[0];
          const startPoint = shape.getPoint(0);

          // add red circle shape
          const circle = group!.addShape('circle', {
            attrs: {
              x: startPoint.x,
              y: startPoint.y,
              fill: '#1890ff',
              r: 3,
            },
            name: 'circle-shape',
          });

          // animation for the red circle
          circle.animate(
            ratio => {
              const tmpPoint = shape.getPoint(ratio);
              return {
                x: tmpPoint.x,
                y: tmpPoint.y,
              };
            },
            {
              repeat: true, // Whether executes the animation repeatedly
              duration: 2000, // the duration for executing once
            }
          );
        },
      },
      'quadratic'
    );
  };

  formatText = (text, length = 10, ellipsis = '...') => {
    if (!text) return '';
    if (text.length > length) {
      return `${text.substring(0, length)}${ellipsis}`;
    }
    return text;
  };

  labelFormatter = (text, minLength = 10) => {
    if (text && text.split('').length > minLength)
      return `${text.substring(0, minLength)}...`;
    return text;
  };

  /**
   * Filter edges by protocols, like TCP, UDP, ICMP
   * @param edge
   * @param protocols: in ["tcp", "udp", "icmp"]
   */
  checkProtocol = (edge, protocols) => {
    if (
      protocols.length === 0 ||
      !edge.protocols ||
      edge.protocols.length === 0
    )
      return false;
    if (protocols.length === 3) return true;
    return protocols.some(r => edge.protocols.indexOf(r) >= 0);
  };

  /**
   * Filter edges by risks, like Violation, Threat, Exposure
   * @param edge
   * @param risk
   */
  checkRisk = (edge, risk) => {
    if (risk !== 'all')
      return edge.status !== 'OK' && edge.status !== 'intraGroup';
    else return true;
  };

  /**
   * Filter node by policy modes, like "Discover", "Monitor", "Protect"
   * @param node
   * @param modeFilters
   */
  checkMode = (node, modeFilters) => {
    if (modeFilters.length === 0 || !node.group) return false;
    if (modeFilters.length === 3) return true;
    return modeFilters.some(mode => node.group.endsWith(mode));
  };

  checkDomains = (node, domains) => {
    if (!domains || domains.length === 0) return true;
    else {
      return domains.some(domain => domain.name === node.domain);
    }
  };

  checkGroups = (node, groups) => {
    if (!groups || groups.length === 0) return true;
    else {
      return groups.some(group => group.name === node.clusterId);
    }
  };

  checkCve = (node, cve) => {
    if (cve === 'all') return true;
    return !!node.cve.level;
  };

  /**
   * convert PolicyMode or Protocol to string array
   * @param filter
   * @returns {string[]}
   */
  filterConverter = (filter: PolicyMode | Protocol) =>
    Object.keys(filter).reduce((result: string[], key) => {
      if (filter[key]) result.push(key);
      return result;
    }, []);

  applyAdvFilter = (dataSet: GraphDataSet, advFilter) => {
    const filteredNodesMap = new Map();
    let nodes = dataSet.nodes.filter(node => {
      let result =
        this.checkDomains(node, advFilter.domains) &&
        this.checkGroups(node, advFilter.groups) &&
        this.checkMode(node, this.filterConverter(advFilter.policyMode)) &&
        this.checkCve(node, advFilter.cve);
      if (result) filteredNodesMap.set(node.id, node);
      return result;
    });
    const firstLevelConnectedNodes: Set<string> = new Set();
    let edges = dataSet.edges.filter(edge => {
      const isSource = filteredNodesMap.has(edge.source);
      const isTarget = filteredNodesMap.has(edge.target);
      if (isSource && isTarget)
        return (
          this.checkProtocol(edge, this.filterConverter(advFilter.protocol)) &&
          this.checkRisk(edge, advFilter.risk)
        );
      else if (isSource) {
        firstLevelConnectedNodes.add(edge.target);
        return (
          this.checkProtocol(edge, this.filterConverter(advFilter.protocol)) &&
          this.checkRisk(edge, advFilter.risk)
        );
      } else if (isTarget) {
        firstLevelConnectedNodes.add(edge.source);
        return (
          this.checkProtocol(edge, this.filterConverter(advFilter.protocol)) &&
          this.checkRisk(edge, advFilter.risk)
        );
      } else return false;
    });
    //Todo add type to replace any[]
    let nodesToAppend: any[] = [];
    if (firstLevelConnectedNodes.size) {
      const nodeIds = [...firstLevelConnectedNodes];
      nodesToAppend = nodeIds
        .map(id => dataSet.nodes[this._nodeIdIndexMap.get(id)])
        .filter(node => node !== undefined);
    }

    if (advFilter.risk !== 'all') {
      if (edges.length > 0) {
        let riskyNodes = new Set();
        edges.forEach(edge => {
          riskyNodes.add(edge.source);
          riskyNodes.add(edge.target);
        });
        return {
          nodes: [...nodes.filter(node => riskyNodes.has(node.id))],
          firstLevelNodes: [
            ...nodesToAppend.filter(node => riskyNodes.has(node.id)),
          ],
          edges: edges,
        };
      } else
        return {
          nodes: [],
          firstLevelNodes: [],
          edges: [],
        };
    }

    return {
      nodes: [...nodes],
      firstLevelNodes: [...nodesToAppend],
      edges: edges,
    };
  };

  getLinkedNodeSet = edges =>
    edges.forEach(edge => {
      this.linkedNodeSet.add(edge.source);
      this.linkedNodeSet.add(edge.target);
    });

  getIsolatedNodes = nodes =>
    nodes.filter(node => !this.linkedNodeSet.has(node.id));

  getConnectedNodes = nodes =>
    nodes.filter(node => this.linkedNodeSet.has(node.id));

  getEdgeStyle = (edge, stroke?) => ({
    lineWidth: edge.bytes ? this.getLineWidth(edge.bytes) : 1,
    stroke: stroke ? stroke : MapConstant.EDGE_STATUS_MAP['OK'],
    opacity: 0.3,
    endArrow: {
      path: G6.Arrow.triangle(3, 6, 6),
      d: 8,
    },
  });

  /**
   * Get domain nodes/edges
   * @returns {{nodes: Array, edges: Array}}
   * @param dataSet the dataSet object {{nodes: Array, edges: Array}}
   * @param domain the domain name
   * @param collapsedDomains Collapsed domains
   */
  collapseDomain = (dataSet, domain, collapsedDomains) => {
    const nodes = dataSet.nodes.filter(node => node.domain === domain);

    const domainEdgeMap = new Map();
    dataSet.edges.forEach(edge => {
      if (edge.fromDomain !== domain && edge.toDomain !== domain) return;
      else if (edge.fromDomain === domain && edge.toDomain === domain) {
        const linkId = `${domain}${domain}`;
        let selfLink = domainEdgeMap.get(linkId);
        if (!selfLink)
          domainEdgeMap.set(linkId, {
            id: `${domain}${domain}`,
            source: domain,
            target: domain,
            bytes: edge.bytes,
            type: 'loop',
            loopCfg: {
              dist: 20,
            },
            style: this.getEdgeStyle(edge),
            value: 1,
          });
        else {
          selfLink.value += 1;
          selfLink.bytes += edge.bytes;
          selfLink.style.lineWidth = this.getLineWidth(selfLink.bytes);
        }
      } else if (edge.fromDomain === domain) {
        let target = edge.target;
        if (collapsedDomains.has(edge.toDomain)) target = edge.toDomain;
        const linkId = `${domain}${target}`;
        let sourceLink = domainEdgeMap.get(linkId);
        if (!sourceLink)
          domainEdgeMap.set(linkId, {
            id: linkId,
            source: domain,
            target: target,
            bytes: edge.bytes,
            type: 'quadratic',
            style: this.getEdgeStyle(edge),
            value: 1,
          });
        else {
          sourceLink.value += 1;
          sourceLink.bytes += edge.bytes;
          sourceLink.style.lineWidth = this.getLineWidth(sourceLink.bytes);
        }
      } else if (edge.toDomain === domain) {
        let source = edge.source;
        if (collapsedDomains.has(edge.fromDomain)) source = edge.fromDomain;

        const linkId = `${source}${domain}`;
        let targetLink = domainEdgeMap.get(linkId);
        if (!targetLink)
          domainEdgeMap.set(linkId, {
            id: linkId,
            source: source,
            target: domain,
            bytes: edge.bytes,
            type: 'quadratic',
            style: this.getEdgeStyle(edge),
            value: 1,
          });
        else {
          targetLink.value += 1;
          targetLink.bytes += edge.bytes;
          targetLink.style.lineWidth = this.getLineWidth(targetLink.bytes);
        }
      }
    });
    return { nodes: nodes, edges: [...domainEdgeMap.values()] };
  };

  getDomainDataSet = (domain, dataSet) => {
    const nodes = dataSet.nodes.filter(node => node.domain === domain);

    const edges = dataSet.edges.filter(
      edge => edge.fromDomain === domain || edge.toDomain === domain
    );

    return { nodes: nodes, edges: edges };
  };

  getDomainNodeSize = memberCount => {
    if (memberCount > this.domainSizeMap.length)
      return this.domainSizeMap[this.domainSizeMap.length - 1];
    return this.domainSizeMap[memberCount - 1];
  };

  nodeToDomain = node => {
    const domainMemberCount = this._domainMap.get(node.domain).value;
    const nodeSize = this.getDomainNodeSize(domainMemberCount);
    return {
      id: node.domain,
      type: 'image',
      size: [nodeSize, nodeSize],
      oriLabel: node.domain,
      label: this.formatText(node.domain, 12, '...'),
      value: 1,
      img: 'assets/img/icons/graph/domain.svg',
      group: 'domain',
      kind: 'domain',
      domain: node.domain,
    };
  };

  /**
   *`
   * @param node
   * @param node.scan_summary the vulnerability info
   * @param node.scanBrief the vulnerability info
   * @param node.children the containers inside pod
   * @returns {{level: String high: Number medium: Number}}
   */
  getCveLevel = node => {
    let high = 0,
      medium = 0;
    let scanBrief = node.scan_summary || node.scanBrief;
    if (scanBrief) {
      high = scanBrief.high;
      medium = scanBrief.medium;
    }
    if (node.children) {
      high += node.children.reduce((acc, child) => {
        let scanBrief = child.scan_summary || child.scanBrief;
        if (scanBrief && scanBrief.high) return acc + scanBrief.high;
        else return acc;
      }, 0);

      medium += node.children.reduce((acc, child) => {
        let scanBrief = child.scan_summary || child.scanBrief;
        if (scanBrief && scanBrief.medium) return acc + scanBrief.medium;
        else return acc;
      }, 0);
    }
    if (high > 0) return { level: 'high', high: high, medium: medium };
    else if (medium > 0) return { level: 'medium', high: high, medium: medium };
    else return { level: '', high: 0, medium: 0 };
  };

  getGroupVulnerabilities = group => {
    const members = group.members;
    let nodesInRisk;
    if (members && members.length > 0) {
      nodesInRisk = members.map(node => this.getCveLevel(node));
    }
    if (nodesInRisk && nodesInRisk.length > 0) {
      return nodesInRisk.reduce(
        (acc, node) => {
          if (node) {
            acc.high += node.high;
            acc.medium += node.medium;
            return acc;
          } else return acc;
        },
        { high: 0, medium: 0 }
      );
    }
  };

  formatNode = node => {
    if (node.oriLabel && node.oriLabel.length > node.label.length) return;
    const iconName = this.groupToIconType[node.group];
    if (iconName)
      node.icon = {
        show: true,
        img: `assets/img/icons/graph/${iconName}.svg`,
      };

    node.style = {
      stroke: this.strokeColor['Discover'],
    };

    if (node.group && node.group.endsWith('Protect'))
      node.style = {
        stroke: this.strokeColor['Protect'],
        fill: this.fillColor['Protect'],
      };
    else if (node.group && node.group.endsWith('Monitor'))
      node.style = {
        stroke: this.strokeColor['Monitor'],
        fill: this.fillColor['Monitor'],
      };

    node.oriLabel = node.label;
    node.label = this.formatText(node.label, 10, '...');
    if (node.service_mesh) {
      node.size = 40;
      node.icon.width = 30;
      node.icon.height = 30;
      node.kind = 'mesh';
    }
  };

  /**
   * Check if we need hide the node
   * @param node
   * @param settings
   * @returns {boolean|boolean} true if node need to be hidden, else false
   */
  checkSettingsForNode = (node, settings) => {
    return settings.showSysNode ? false : node.platform_role === 'System';
  };

  hasSystemAppOnly = (applications?: string[]) => {
    if (!applications || applications.length === 0 || applications.length > 3)
      return false;
    else {
      if (applications.length === 1)
        return (
          applications.indexOf('DNS') > -1 ||
          applications.indexOf('DHCP') > -1 ||
          applications.indexOf('NTP') > -1
        );
      if (applications.length === 2)
        return (
          (applications.indexOf('DNS') > -1 &&
            applications.indexOf('DHCP') > -1) ||
          (applications.indexOf('DNS') > -1 &&
            applications.indexOf('NTP') > -1) ||
          (applications.indexOf('NTP') > -1 &&
            applications.indexOf('DHCP') > -1)
        );
      if (applications.length === 3)
        return (
          applications.indexOf('DNS') > -1 &&
          applications.indexOf('DHCP') > -1 &&
          applications.indexOf('NTP') > -1
        );
      else return false;
    }
  };

  /**
   * Check if we need hide the edge
   * @param edge
   * @param settings
   * @returns {boolean|boolean}
   */
  checkSettingsForEdge = (edge, settings) => {
    return settings.showSysApp
      ? false
      : this.hasSystemAppOnly(edge.applications);
  };

  processNodes = (nodes, serverData, onRefresh, settings) => {
    let domains: any[];
    let groups: any[];
    const domainMap: Map<string, any> = new Map();
    const clusterMap = new Map();
    if (onRefresh) this._nodeIdIndexMap.clear();

    nodes.forEach((node, i) => {
      node.cve = this.getCveLevel(node);

      if (onRefresh) this._nodeIdIndexMap.set(node.id, i);

      this.formatNode(node);

      if (this.checkSettingsForNode(node, settings)) return;

      if (node.id === 'external') {
        node.type = 'image';
        node.img = 'assets/img/icons/graph/cloud.svg';
        node.size = [50, 50];
        delete node.icon;

        clusterMap.set(node.id, {
          name: node.id,
          domain: node.domain,
          group: 'external',
          clusterName: 'External Network',
          members: [node.id],
          value: 1,
          status: '',
        });
      } else {
        if (node.clusterId)
          if (node.domain) {
            // node.comboId = `co${node.clusterId}`;

            if (!domainMap.get(node.domain))
              domainMap.set(node.domain, {
                name: node.domain,
                type: 'domain',
                value: 0,
                members: [],
                status: '',
              });
          }
        if (node.clusterId) {
          let theGroup = clusterMap.get(node.clusterId);
          if (!theGroup) {
            clusterMap.set(node.clusterId, {
              name: node.clusterId,
              domain: node.domain,
              group: node.group,
              clusterName: node.clusterName,
              members: [node.id],
              value: 1,
              cve: node.cve,
              policyMode: node.policyMode,
              status: '',
              kind: 'group',
              quarantines: node.state === 'quarantined' ? 1 : 0,
            });
            let theDomain = domainMap.get(node.domain);
            if (theDomain) {
              theDomain.value += 1;
              theDomain.members.push(node.clusterId);
            }
          } else {
            theGroup.value += 1;
            theGroup.members.push(node.id);
            theGroup.cve.high += node.cve.high;
            theGroup.cve.medium += node.cve.medium;
            if (theGroup.cve.high > 0) theGroup.cve.level = 'high';
            else if (theGroup.cve.medium > 0) theGroup.cve.level = 'medium';
            theGroup.quarantines += node.state === 'quarantined' ? 1 : 0;
          }
        } else {
          if (node.domain) {
            let theDomain = domainMap.get(node.domain);
            if (theDomain) {
              theDomain.value += 1;
              theDomain.members.push(node.id);
            }
          }
        }
      }
    });

    domains = [...domainMap.values()];
    groups = [...clusterMap.values()];

    if (onRefresh) {
      this._clusterMap = clusterMap;
      this._domainMap = domainMap;
      this._domains = domains;
      this._groups = groups;
    } else {
      this.filteredClusterMap = clusterMap;
      this.filteredDomainMap = domainMap;
    }

    //Deal with one node group
    nodes.forEach(node => {
      const nodeGroup = clusterMap.get(node.clusterId);
      if (node.comboId) {
        if (nodeGroup.value <= 1) {
          // node.comboId = `co${node.domain}`;
          delete node.comboId;
        }
      }
    });

    const sizeMap = [25, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

    const getComboSize = memberCount => {
      if (memberCount > sizeMap.length) return sizeMap[sizeMap.length - 1];
      return sizeMap[memberCount - 1];
    };

    const getClusterIcon = group => {
      if (!group) return 'cluster.svg';
      if (group.endsWith('Discover')) return 'cluster-d.svg';
      if (group.endsWith('Protect')) return 'cluster-p.svg';
      if (group.endsWith('Monitor')) return 'cluster-m.svg';
      return 'cluster.svg';
    };

    const getStrokeColor = group => {
      if (!group) return this.strokeColor['Discover'];
      if (group.endsWith('Protect')) return this.strokeColor['Protect'];
      if (group.endsWith('Monitor')) return this.strokeColor['Monitor'];
      return this.strokeColor['Discover'];
    };

    const getFillColor = group => {
      if (!group) return this.fillColor['Discover'];
      if (group.endsWith('Protect')) return this.fillColor['Protect'];
      if (group.endsWith('Monitor')) return this.fillColor['Monitor'];
      return this.fillColor['Discover'];
    };

    const clusterNodes = groups
      .filter(
        group => !!serverData.nodes[this._nodeIdIndexMap.get(group.members[0])]
      )
      .map(group => {
        if (group.name !== 'external') {
          if (group.value === 1) {
            let clusterNode = serverData.nodes.find(
              node => node.id === group.members[0]
            );
            clusterNode.cluster = group.domain;
            return clusterNode;
          } else {
            let clusterNode = {
              id: group.name,
              type: 'markedNode',
              size: getComboSize(group.value),
              oriLabel: group.clusterName,
              label: this.formatText(group.clusterName, 15, '...'),
              icon: {
                show: true,
                img: `assets/img/icons/graph/${getClusterIcon(group.group)}`,
                width: Math.round(getComboSize(group.value) * 0.7),
                height: Math.round(getComboSize(group.value) * 0.7),
              },
              style: {
                stroke: getStrokeColor(group.group),
                fill: getFillColor(group.group),
              },
              cve: group.cve,
              policyMode: group.policyMode,
              domain: group.domain,
              cluster: group.domain,
              clusterId: group.clusterId,
              kind: 'group',
              quarantines: group.quarantines,
            };
            if (clusterNode.quarantines) clusterNode.style.fill = '#ffcccb';
            return clusterNode;
          }
        } else
          return {
            id: 'external',
            type: 'image',
            label: group.name,
            group: 'external',
            domain: 'external',
            cluster: 'external',
            clusterId: 'external',
            img: 'assets/img/icons/graph/cloud.svg',
            size: [50, 50],
          };
      });

    return clusterNodes;
  };

  getEdgeId = (edge, onRefresh) => {
    const fromGroup = onRefresh
      ? this._clusterMap.get(edge.fromGroup)
      : this.filteredClusterMap.get(edge.fromGroup);
    const toGroup = onRefresh
      ? this._clusterMap.get(edge.toGroup)
      : this.filteredClusterMap.get(edge.toGroup);
    if (!fromGroup || !toGroup) return { undefined, fromGroup, toGroup };

    let edgeId, edgeSource, edgeTarget;
    if (fromGroup.value === 1 && toGroup.value === 1) {
      if (edge.id) edgeId = edge.id;
      else edgeId = `${edge.source}${edge.target}`;
    } else {
      if (fromGroup.value === 1 && toGroup.value > 1) {
        edgeSource = edge.source;
        edgeTarget = edge.toGroup;
      } else if (fromGroup.value > 1 && toGroup.value === 1) {
        edgeSource = edge.fromGroup;
        edgeTarget = edge.target;
      } else {
        edgeSource = edge.fromGroup;
        edgeTarget = edge.toGroup;
      }
      edgeId = `${edgeSource}${edgeTarget}`;
    }
    return { edgeId, edgeSource, edgeTarget };
  };

  createClusterEdge = (serverData, edge, clusterEdgeMap, onRefresh) => {
    let theEdge;
    let { edgeId, edgeSource, edgeTarget } = this.getEdgeId(edge, onRefresh);

    if (edgeId === `${edge.source}${edge.target}`) theEdge = edge;
    else
      theEdge = {
        id: edgeId,
        source: edgeSource,
        target: edgeTarget,
        type: 'quadratic',
        style: this.getEdgeStyle(
          edge,
          MapConstant.EDGE_STATUS_MAP[edge.status]
        ),
        label: '',
        oriLabel: edge.oriLabel,
        status: edge.status,
        members: [edge.id],
        kind: 'group',
        fromDomain: edge.fromDomain,
        toDomain: edge.toDomain,
        bytes: edge.bytes,
        weight: 1,
      };

    if (theEdge.style.stroke !== MapConstant.EDGE_STATUS_MAP['OK'])
      theEdge.stateStyles = {
        active: {
          stroke: MapConstant.EDGE_STATUS_MAP[theEdge.status],
          opacity: 1.0,
        },
      };

    clusterEdgeMap.set(edgeId, theEdge);
    if (edge.fromGroup === edge.toGroup) {
      theEdge.type = 'loop';
      theEdge.style.endArrow = true;
      theEdge.loopCfg = {
        dist: 20,
      };
      const loopNode =
        serverData.nodes[this.getNodeIdIndexMap().get(edge.source)];
      if (loopNode && loopNode.service_mesh) {
        theEdge.style.stroke = '#9FB8AD';
        theEdge.style.opacity = 0.8;
      }
    }
  };

  aggregateLinks = (clusterEdge, edge) => {
    clusterEdge.weight += 1;
    clusterEdge.bytes += edge.bytes;
    clusterEdge.members.push(edge.id);
    clusterEdge.status =
      MapConstant.EDGE_STATUS_LEVEL_MAP[edge.status] >
      MapConstant.EDGE_STATUS_LEVEL_MAP[clusterEdge.status]
        ? edge.status
        : clusterEdge.status;
    clusterEdge.style.lineWidth = this.getLineWidth(clusterEdge.bytes);
    clusterEdge.style.stroke =
      MapConstant.EDGE_STATUS_LEVEL_MAP[edge.status] >
      MapConstant.EDGE_STATUS_LEVEL_MAP[clusterEdge.status]
        ? MapConstant.EDGE_STATUS_MAP[edge.status]
        : MapConstant.EDGE_STATUS_MAP[clusterEdge.status];
    clusterEdge.oriLabel = this.aggregateEdgeLabel(
      clusterEdge.oriLabel,
      edge.oriLabel
    );

    if (clusterEdge.style.stroke !== MapConstant.EDGE_STATUS_MAP['OK'])
      clusterEdge.stateStyles = {
        active: {
          stroke: MapConstant.EDGE_STATUS_MAP[clusterEdge.status],
          opacity: 1.0,
        },
      };
  };

  formatEdge = edge => {
    if (edge.oriLabel && edge.oriLabel.length > 0) return;
    edge.oriLabel = edge.label;
    edge.label = '';
    edge.type = 'quadratic';
    edge.style = this.getEdgeStyle(
      edge,
      MapConstant.EDGE_STATUS_MAP[edge.status]
    );
    if (edge.style.stroke !== MapConstant.EDGE_STATUS_MAP['OK'])
      edge.stateStyles = {
        active: {
          stroke: MapConstant.EDGE_STATUS_MAP[edge.status],
          opacity: 1.0,
        },
      };
  };

  processEdges = (serverData, edges, onRefresh, settings) => {
    const clusterEdgeMap = new Map();
    const edgeIdIndexMap = new Map();
    edges.forEach((edge, i) => {
      edgeIdIndexMap.set(edge.id, i);

      this.formatEdge(edge);

      //All the nodes have service group, so fromCluster and toCluster should be there
      const fromCluster = this._clusterMap.get(edge.fromGroup);
      const toCluster = this._clusterMap.get(edge.toGroup);

      if (!fromCluster || !toCluster) return;
      if (this.checkSettingsForEdge(edge, settings)) return;

      //check if cluster edge exist
      const { edgeId } = this.getEdgeId(edge, onRefresh);
      let clusterEdge = clusterEdgeMap.get(edgeId);
      if (clusterEdge) {
        this.aggregateLinks(clusterEdge, edge);
      } else {
        //create line
        this.createClusterEdge(serverData, edge, clusterEdgeMap, onRefresh);
      }
    });

    if (onRefresh) this._edgeIdIndexMap = edgeIdIndexMap;
    return [...clusterEdgeMap.values()];
  };

  cacheNodePositions = nodes => {
    const positionMap = {};
    const nodeLength = nodes.length;
    for (let i = 0; i < nodeLength; i++) {
      const node = nodes[i].getModel();
      positionMap[node.id] = {
        x: node.x,
        y: node.y,
      };
    }
    return positionMap;
  };

  saveBlacklist = (user: string, blacklist: Blacklist) => {
    this.http
      .post(PathConstant.NETWORK_BLACKLIST_URL, {
        user: user,
        blacklist: blacklist,
      })
      .subscribe(() => {});
  };

  quarantine = (id: string, toQuarantine: boolean) =>
    this.http
      .post(PathConstant.CONTAINER_URL, {
        id: id,
        quarantine: toQuarantine,
      })
      .pipe();

  keepLive = () => {
    this.http.patch(PathConstant.KEEP_ALIVE_URL, {}).subscribe(() => {});
  };

  prepareActiveSessionGrid: () => GridOptions = () => {
    let gridOptions: GridOptions;
    const activeColumns = [
      {
        headerName: this.translate.instant('network.gridHeader.APP'),
        field: 'application',
      },
      {
        headerName: this.translate.instant('network.gridHeader.CLIENT'),
        field: 'client_ip',
        sortable: false,
        cellRenderer: params => {
          /** @namespace params.data.client_ip */
          /** @namespace params.data.client_port */
          return this.sanitizer.sanitize(
            SecurityContext.HTML,
            '<div>' +
              params.data.client_ip +
              ':' +
              params.data.client_port +
              '</div>'
          );
        },
      },
      {
        headerName: this.translate.instant('network.gridHeader.SERVER'),
        field: 'server_ip',
        sortable: false,
        cellRenderer: params => {
          /** @namespace params.data.server_ip */
          /** @namespace params.data.server_port */
          return this.sanitizer.sanitize(
            SecurityContext.HTML,
            '<div>' +
              params.data.server_ip +
              ':' +
              params.data.server_port +
              '</div>'
          );
        },
      },
      {
        headerName: this.translate.instant('network.gridHeader.CLIENT_BYTES'),
        field: 'client_bytes',
        valueFormatter: this.numberCellFormatter,
        cellClass: 'grid-right-align',
        cellRenderer: 'agAnimateShowChangeCellRenderer',
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
        width: 200,
      },
      {
        headerName: this.translate.instant('network.gridHeader.SERVER_BYTES'),
        field: 'server_bytes',
        valueFormatter: this.numberCellFormatter,
        cellClass: 'grid-right-align',
        cellRenderer: 'agAnimateShowChangeCellRenderer',
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
        width: 200,
      },
      {
        headerName: this.translate.instant('network.gridHeader.POLICY'),
        field: 'policy_id',
        cellRenderer: params => {
          if (params.value >= 10000)
            return `<span class="action-label px-1 ${
              MapConstant.colourMap['LEARNED']
            }">${this.sanitizer.sanitize(
              SecurityContext.HTML,
              params.value
            )}</span>`;
          else if (params.value > 0)
            return `<span class="action-label px-1 ${
              MapConstant.colourMap['CUSTOM']
            }">${this.sanitizer.sanitize(
              SecurityContext.HTML,
              params.value
            )}</span>`;
          else return null;
        },
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      {
        headerName: this.translate.instant('network.gridHeader.ACTION'),
        field: 'policy_action',
        cellRenderer: params => {
          if (params.value) {
            let mode = this.utils.getI18Name(params.value);
            let labelCode = MapConstant.colourMap[params.value];
            if (!labelCode) labelCode = 'info';
            return `<span class="action-label ${labelCode}">${this.sanitizer.sanitize(
              SecurityContext.HTML,
              mode
            )}</span>`;
          } else return null;
        },
        width: 130,
        maxWidth: 140,
      },
      {
        headerName: this.translate.instant('network.gridHeader.AGE'),
        field: 'age',
        valueFormatter: this.ageFormatter,
        comparator: this.ageComparator,
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
      },
    ];
    gridOptions = this.utils.createGridOptions(activeColumns, this.$win);
    gridOptions.getRowId = (params: GetRowIdParams) => {
      return params.data.id;
    };
    return gridOptions;
  };

  prepareTrafficHistoryGrid: (conversationDetail) => GridOptions =
    conversationDetail => {
      const sanitizer = this.sanitizer;
      const conversationHistoryColumns: ColDef[] = [
        {
          headerName: ' ',
          cellRenderer: params => {
            const proxy = `<div class="action-label info"> Proxy </div>`;
            let result;

            if (params.data.severity) {
              if (params.data.to_sidecar)
                result = `<span><em class="fas fa-bug text-danger me-1"></em> ${params.data.threat_name}${proxy}</span>`;
              else
                result = `<span><em class="fas fa-bug text-danger"></em> ${params.data.threat_name}</span>`;
            } else if (
              params.data.policy_action === 'violate' ||
              params.data.policy_action === 'deny'
            ) {
              if (params.data.to_sidecar)
                result = `<span><em class="fas fa-ban text-warning me-1"></em>${proxy}</span>`;
              else
                result = `<span><em class="fas fa-ban text-warning"></em></span>`;
            } else {
              if (params.data.to_sidecar)
                result = `<span><em class="fas fa-check text-success me-1"></em>${proxy}</span>`;
              else
                result = `<span><em class="fas fa-check text-success"></em></span>`;
            }

            // Append the "Namespace Boundary Enabled" if needed and return the final string
            if (params.data.nbe) {
              result = `${result} <span class="ml-1 action-label info">${GlobalConstant.Namespace_Boundary_Enabled}</span>`;
            }
            return result;
          },
          sortable: false,
          width: 180,
          minWidth: 165,
        },
        {
          headerName: this.translate.instant('network.gridHeader.APP'),
          field: 'application',
        },
        {
          headerName: this.translate.instant('network.gridHeader.CLIENT_IP'),
          field: 'client_ip',
          cellRenderer: ClientIpCellComponent,
          width: 215,
        },
        {
          headerName: this.translate.instant('network.gridHeader.SERVER_IP'),
          field: 'server_ip',
          cellRenderer: ServerIpCellComponent,
          minWidth: 200,
          width: 215,
        },
        {
          headerName: this.translate.instant('network.gridHeader.PORT'),
          sortable: false,
          cellRenderer: params => {
            if (params.data.mapped_port === params.data.port)
              return params.data.port;
            else
              return this.sanitizer.sanitize(
                SecurityContext.HTML,
                '<span>' +
                  params.data.port +
                  ':' +
                  +params.data.mapped_port.substring(
                    params.data.mapped_port.indexOf('/') + 1,
                    params.data.mapped_port.length
                  ) +
                  '</span>'
              );
          },
        },
        {
          headerName: this.translate.instant('network.gridHeader.BYTES'),
          field: 'bytes',
          cellRenderer: this.numberCellFormatter,
          comparator: this.bytesComparator,
          icons: {
            sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
            sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
          },
        },
        {
          headerName: this.translate.instant('network.edgeDetails.RULE_ID'),
          field: 'policy_id',
          cellRenderer: params => {
            if (params.value >= 10000)
              return `<span class="action-label px-1 ${
                MapConstant.colourMap['LEARNED']
              }">${this.sanitizer.sanitize(
                SecurityContext.HTML,
                params.value
              )}</span>`;
            else if (params.value > 0)
              return `<span class="action-label px-1 ${
                MapConstant.colourMap['CUSTOM']
              }">${this.sanitizer.sanitize(
                SecurityContext.HTML,
                params.value
              )}</span>`;
            else return null;
          },
          width: 100,
          minWidth: 100,
          maxWidth: 100,
        },
        {
          headerName: this.translate.instant('network.gridHeader.ACTION'),
          field: 'policy_action',
          cellRenderer: params => {
            if (params.value) {
              let mode = this.utils.getI18Name(params.value);
              let labelCode = MapConstant.colourMap[params.value];
              if (!labelCode) labelCode = 'info';
              return `<span class="action-label px-1 ${labelCode}">${this.sanitizer.sanitize(
                SecurityContext.HTML,
                mode
              )}</span>`;
            } else return null;
          },
          minWidth: 100,
          width: 100,
          maxWidth: 110,
        },
        {
          headerName: this.translate.instant('network.gridHeader.TIME'),
          field: 'last_seen_at',
          comparator: this.dateComparator,
          icons: {
            sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
            sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
          },
          minWidth: 160,
          maxWidth: 200,
        },
      ];

      return this.utils.createGridOptions(
        conversationHistoryColumns,
        this.$win
      );
    };

  prepareDomainGrid: () => GridOptions = () => {
    let domainGridOptions: GridOptions;
    let columnDefs4Domain = [
      {
        headerName: this.translate.instant('group.gridHeader.NAME'),
        cellRenderer: params => {
          //TODO: set clusterId for ip_service for sorting.
          if (params && params.data) {
            if (
              params.data.kind === 'group' ||
              (params.data.group && params.data.group === 'ip_service')
            ) {
              return params.data.id;
            } else if (
              params.data.group.startsWith('container') ||
              params.data.kind === 'mesh'
            ) {
              return params.data.clusterId;
            }
          }
        },
      },
      {
        headerName: this.translate.instant('group.gridHeader.VULNERABILITIES'),
        field: 'cve',
        cellRenderer: params => {
          let display = '';
          if (params.value && params.value.high)
            display += `<span class="badge badge-danger ">${params.value.high}</span>`;
          else
            display += `<span class="badge badge-success ">${params.value.high}</span>`;
          if (params.value && params.value.medium)
            display += `<span class="badge badge-warning">${params.value.medium}</span>`;
          else
            display += `<span class="badge badge-success ">${params.value.medium}</span>`;
          return this.sanitizer.sanitize(SecurityContext.HTML, display);
        },
        width: 120,
        maxWidth: 150,
      },
      {
        headerName: this.translate.instant('group.gridHeader.POLICY_MODE'),
        field: 'policyMode',
        cellRenderer: params => {
          let mode = '';
          if (params.value) {
            mode = this.utils.getI18Name(params.value);
            let labelCode = MapConstant.colourMap[params.value];
            if (!labelCode) return '';
            else
              return `<span class="type-label policy_mode ${labelCode}">${mode}</span>`;
          } else return '';
        },
        width: 100,
        maxWidth: 120,
        minWidth: 100,
      },
    ];
    domainGridOptions = this.utils.createGridOptions(
      columnDefs4Domain,
      this.$win
    );
    return domainGridOptions;
  };

  getDomains = () => this._domains;

  getGroups = () => this._groups;

  getDomainMap = () => this._domainMap;

  getClusterMap = () => this._clusterMap;

  getNodeIdIndexMap = () => this._nodeIdIndexMap;

  getEdgeIdIndexMap = () => this._edgeIdIndexMap;

  private getLineWidth: (bytes: number) => number = (bytes: number) => {
    const bytesInMB = Math.min(this.oneMillion, bytes / this.oneMillion);
    return bytesInMB < 10 ? 1 : Math.round(Math.log10(bytesInMB));
  };

  private aggregateEdgeLabel(label: string, newLabel: string): string {
    if (!newLabel || label.length >= 15) return label;
    let joined = Array.from(
      new Set([label, newLabel].join(',').split(','))
    ).join(',');
    return this.formatText(joined, 15);
  }

  private numberCellFormatter = params => {
    if (!params.value) return '';
    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      this.bytesPipe.transform(params.value)
    );
  };

  private ageFormatter = params =>
    this.utils.humanizeDuration(moment.duration(params.value, 'seconds'));

  private ageComparator = (value1, value2, node1, node2) =>
    node1.data.age - node2.data.age;

  private bytesComparator = (value1, value2, node1, node2) =>
    node1.data.bytes - node2.data.bytes;

  private dateComparator = (value1, value2, node1, node2) => {
    return (
      Date.parse(node1.data.last_seen_at) - Date.parse(node2.data.last_seen_at)
    );
  };
}
