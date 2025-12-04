import { Injectable, SecurityContext } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { getDisplayName, isIpV4, isIpV6 } from '@common/utils/common.utils';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { DatePipe } from '@angular/common';
import { TimeagoFormatter } from 'ngx-timeago';
import { map } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EnforcerBriefDialogComponent } from '@routes/components/enforcer-brief/enforcer-brief-dialog/enforcer-brief-dialog.component';

interface HostResponse {
  host: any;
}

interface EnforcerResponse {
  enforcer: any;
}

interface ThreatResponse {
  threat: any;
}

interface ProcessProfileResponse {
  process_profile: any;
}

interface PolicyRuleResponse {
  rule: any;
}

@Injectable()
export class SecurityEventsService {
  private readonly $win;
  securityEventsList: Array<any> = new Array();
  dateSliderCtx: any;
  page: number = 1;
  begin: number = 0;
  openedIndex: number = -1;
  openedPage: number = -1;
  limit: number = 30;
  enforcerModal: MatDialogRef<any>;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private utils: UtilsService,
    private authUtilsService: AuthUtilsService,
    private datePipe: DatePipe,
    private timeAgoFormatter: TimeagoFormatter,
    private dialog: MatDialog
  ) {
    this.$win = $(GlobalVariable.window);
  }

  EVENT_TYPE = {
    THREAT: 'threat',
    VIOLATION: 'violation',
    INCIDENT: 'incident',
  };

  ENDPOINT = {
    DESTINATION: 'destination',
    SOURCE: 'source',
  };

  TARGET = {
    SERVER: 'server',
    CLIENT: 'client',
  };

  LABELS = {
    NETWORK: 'network',
    PRIVILEGE: 'privilege',
    FILE: 'file',
    TUNNEL: 'tunnel',
    PROCESS: 'process',
    HOST: 'host',
    CONTAINER: 'container',
    PACKAGE: 'package',
    OTHER: 'other',
  };

  cachedSecurityEvents: Array<any> = [];
  displayedSecurityEvents: Array<any> = [];

  filterByLevels = (level, ...checkedArray) => {
    let res = false;
    let hasCheckedItems = false;
    for (let checkedItem of checkedArray) {
      if (checkedItem.value) {
        hasCheckedItems = true;
        if (level.toLowerCase() === checkedItem.key.toLowerCase()) {
          res = true;
        }
      }
    }
    return hasCheckedItems ? res : true;
  };

  filterByLabels = (labels, ...checkedArray) => {
    let res = false;
    let hasCheckedItems = false;
    for (let checkedItem of checkedArray) {
      if (checkedItem.value) {
        hasCheckedItems = true;
        if (labels.indexOf(checkedItem.key) >= 0) {
          res = true;
        }
      }
    }
    return hasCheckedItems ? res : true;
  };

  editDisplayedThreat = (threat, ipMap) => {
    let displayedThreat: any = {
      id: '',
      name: '',
      name4Pdf: '',
      type: {
        name: '',
        cssColor: '',
      },
      reportedAt: '',
      reportedTimestamp: 0,
      relativeDate: '',
      endpoint: {
        source: {},
        destination: {},
      },
      applications: '',
      hostId: '',
      hostName: '',
      enforcerId: '',
      enforcerName: '',
      details: {},
      orgReportedAt: '',
      reportedOn: '',
    };
    let source = this._getEndpointDirection(
      threat,
      this.EVENT_TYPE.THREAT,
      this.ENDPOINT.SOURCE
    );
    let destination = this._getEndpointDirection(
      threat,
      this.EVENT_TYPE.THREAT,
      this.ENDPOINT.DESTINATION
    );
    displayedThreat.id = threat.id;
    displayedThreat.name = threat.name;
    displayedThreat.name4Pdf = threat.name;
    displayedThreat.type.name = this.EVENT_TYPE.THREAT;
    displayedThreat.type.cssColor = 'fa icon-size-2 fa-bug text-danger';
    displayedThreat.reportedAt = this.datePipe.transform(
      threat.reported_at,
      'MMM dd, y HH:mm:ss'
    );
    displayedThreat.relativeDate = this.timeAgoFormatter.format(
      new Date(displayedThreat.reportedAt).getTime()
    );
    displayedThreat.orgReportedAt = this.datePipe.transform(
      threat.reported_at,
      'yyyy-MM-ddTHH:mm:ss'
    );
    displayedThreat.reportedOn = this.datePipe.transform(
      threat.reported_at,
      'yyyyMMdd'
    );
    displayedThreat.reportedTimestamp = threat.reported_timestamp;
    displayedThreat.endpoint.source = this._getEndpointInfo(
      source,
      this.ENDPOINT.SOURCE,
      ipMap
    );
    displayedThreat.endpoint.destination = this._getEndpointInfo(
      destination,
      this.ENDPOINT.DESTINATION,
      ipMap
    );
    displayedThreat.applications =
      threat.application && threat.application.length > 0
        ? threat.application
        : null;
    displayedThreat.hostId = threat.host_id || '';
    displayedThreat.hostName = threat.host_name || '';
    displayedThreat.enforcerId = threat.enforcer_id || '';
    displayedThreat.enforcerName = threat.enforcer_name || '';
    displayedThreat.details = this._editThreatDetails(
      threat,
      source,
      destination
    );
    return displayedThreat;
  };

  editDisplayedViolation = (violation, ipMap) => {
    let displayedViolation: any = {
      name: '',
      name4Pdf: '',
      ruleId: 0,
      reviewRulePermission: '',
      type: {
        name: '',
        cssColor: '',
      },
      reportedAt: '',
      reportedTimestamp: 0,
      relativeDate: '',
      endpoint: {
        source: {},
        destination: {},
      },
      fqdn: '',
      nbe: false,
      applications: '',
      hostId: '',
      hostName: '',
      enforcerId: '',
      enforcerName: '',
      details: {},
    };

    let source = this._getEndpointDirection(
      violation,
      this.EVENT_TYPE.VIOLATION,
      this.ENDPOINT.SOURCE
    );
    let destination = this._getEndpointDirection(
      violation,
      this.EVENT_TYPE.VIOLATION,
      this.ENDPOINT.DESTINATION
    );
    displayedViolation.name =
      violation.policy_id === 0
        ? violation.nbe
          ? this.translate.instant('securityEvent.CROSS_NAMESPACE_BOUNDARY')
          : this.translate.instant('securityEvent.VIOLATION_NAME_DEFAULT')
        : this.translate.instant('securityEvent.VIOLATION_NAME', {
            policy_id: violation.policy_id,
          });
    displayedViolation.name4Pdf =
      violation.policy_id === 0
        ? violation.nbe
          ? this.translate.instant('securityEvent.CROSS_NAMESPACE_BOUNDARY')
          : this.translate.instant('securityEvent.VIOLATION_NAME_DEFAULT')
        : this.translate.instant('securityEvent.VIOLATION_NAME', {
            policy_id: violation.policy_id,
          });
    displayedViolation.reviewRulePermission = this.getReviewRulePermission(
      source!.domain_name,
      destination!.domain_name
    );
    displayedViolation.ruleId = violation.policy_id;
    displayedViolation.type.name = this.EVENT_TYPE.VIOLATION;
    displayedViolation.type.cssColor = 'fa icon-size-2 fa-ban text-warning';
    displayedViolation.reportedAt = this.datePipe.transform(
      violation.reported_at,
      'MMM dd, y HH:mm:ss'
    );
    displayedViolation.relativeDate = this.timeAgoFormatter.format(
      new Date(displayedViolation.reportedAt).getTime()
    );
    displayedViolation.orgReportedAt = this.datePipe.transform(
      violation.reported_at,
      'yyyy-MM-ddTHH:mm:ss'
    );
    displayedViolation.reportedOn = this.datePipe.transform(
      violation.reported_at,
      'yyyyMMdd'
    );
    displayedViolation.reportedTimestamp = violation.reported_timestamp;
    displayedViolation.endpoint.source = this._getEndpointInfo(
      source,
      this.ENDPOINT.SOURCE,
      ipMap
    );
    displayedViolation.endpoint.destination = this._getEndpointInfo(
      destination,
      this.ENDPOINT.DESTINATION,
      ipMap
    );
    let violationApps = violation.applications
      ? violation.applications.sort().join(', ')
      : null;
    displayedViolation.applications =
      violationApps!.length > 0 ? violationApps : '';
    displayedViolation.hostId = violation.host_id || '';
    displayedViolation.hostName = violation.host_name || '';
    displayedViolation.enforcerId = violation.enforcer_id || '';
    displayedViolation.enforcerName = violation.enforcer_name || '';
    displayedViolation.fqdn = violation.fqdn || '';
    displayedViolation.details = this._editViolationDetails(violation);
    return displayedViolation;
  };

  editDisplayedIncident = (incident, ipMap) => {
    let source = this._getEndpointDirection(
      incident,
      this.EVENT_TYPE.INCIDENT,
      this.ENDPOINT.SOURCE
    );
    let destination = this._getEndpointDirection(
      incident,
      this.EVENT_TYPE.INCIDENT,
      this.ENDPOINT.DESTINATION
    );
    let container: any = {
      domain: '',
      name: '',
      icon: '',
      id: '',
      service: '',
      isHyperlinkEnabled: false,
    };
    if (source!.workload_id || destination!.workload_id) {
      if (source!.workload_id) {
        container.domain = source!.domain_name ? `${source!.domain_name}` : '';
        container.name = source!.workload_name
          ? getDisplayName(source!.workload_name)
          : source!.workload_id;
        container.id = source!.workload_id;
        container.service = source!.service;
        container.isHyperlinkEnabled =
          source!.workload_id !== source!.client_ip;
      } else if (!source!.workload_id && destination!.workload_id) {
        container.domain = destination!.domain_name
          ? `${destination!.domain_name}`
          : '';
        container.name = destination!.workload_name
          ? getDisplayName(destination!.workload_name)
          : destination!.workload_id;
        container.id = destination!.workload_id;
        container.service = destination!.service;
        container.isHyperlinkEnabled =
          destination!.workload_id !== destination!.client_ip;
      }
    }

    let displayedIncident: any = {
      name: '',
      name4Pdf: '',
      reviewRulePermission: '',
      type: {
        name: '',
        cssColor: '',
      },
      reportedAt: '',
      reportedTimestamp: 0,
      relativeDate: '',
      endpoint: {
        source: {},
        destination: {},
      },
      host_name: '',
      container: {},
      applications: '',
      hostId: '',
      hostName: '',
      enforcerId: '',
      enforcerName: '',
      details: {},
      orgReportedAt: '',
      reportedOn: '',
    };

    const getIncidentName = (incident, container) => {
      const constName = incident.name.replace(/\./g, '_').toUpperCase();
      let translateConst = `securityEvent.${constName}`;
      const PROC_NAME_RELATED_INCIDENTS = [
        'HOST_SUSPICIOUS_PROCESS',
        'CONTAINER_SUSPICIOUS_PROCESS',
        'HOST_TUNNEL_DETECTED',
        'CONTAINER_TUNNEL_DETECTED',
        'PROCESS_PROFILE_VIOLATION',
        'HOST_PROCESS_VIOLATION',
        'CONTAINER_FILEACCESS_VIOLATION',
        'HOST_FILEACCESS_VIOLATION',
      ];
      const PROC_CMD_RELATED_INCIDENTS = [
        'HOST_PRIVILEGE_ESCALATION',
        'CONTAINER_PRIVILEGE_ESCALATION',
      ];
      if (
        !incident.proc_name &&
        PROC_NAME_RELATED_INCIDENTS.includes(constName)
      ) {
        translateConst = `securityEvent.${constName}_NO_PROC_NAME`;
      }
      if (
        !incident.proc_cmd &&
        PROC_CMD_RELATED_INCIDENTS.includes(constName)
      ) {
        translateConst = `securityEvent.${constName}_NO_PROC_CMD`;
      }
      return this.translate.instant(translateConst, {
        host_name: incident.host_name || '',
        container: container.id
          ? `${container.domain ? `${container.domain}:` : ''}${
              container.service ? `${container.service}:` : ''
            }${container.name}`
          : '',
        file_path: incident.file_path || '',
        proc_name: incident.proc_name || '',
        proc_cmd: incident.proc_cmd || '',
      });
    };

    displayedIncident.name = getIncidentName(incident, container);
    displayedIncident.name4Pdf = displayedIncident.name;
    displayedIncident.reviewRulePermission = this.getReviewRulePermission(
      source!.domain_name,
      destination!.domain_name
    );
    displayedIncident.type.name = this.EVENT_TYPE.INCIDENT;
    displayedIncident.type.cssColor =
      'fa icon-size-2 fa-exclamation-triangle text-muted';
    displayedIncident.reportedAt = this.datePipe.transform(
      incident.reported_at,
      'MMM dd, y HH:mm:ss'
    );
    displayedIncident.relativeDate = this.timeAgoFormatter.format(
      new Date(displayedIncident.reportedAt).getTime()
    );
    displayedIncident.orgReportedAt = this.datePipe.transform(
      incident.reported_at,
      'yyyy-MM-ddTHH:mm:ss'
    );
    displayedIncident.reportedOn = this.datePipe.transform(
      incident.reported_at,
      'yyyyMMdd'
    );
    displayedIncident.reportedTimestamp = incident.reported_timestamp;
    displayedIncident.endpoint.source = this._getEndpointInfo(
      source,
      this.ENDPOINT.SOURCE,
      ipMap
    );
    displayedIncident.endpoint.destination = this._getEndpointInfo(
      destination,
      this.ENDPOINT.DESTINATION,
      ipMap
    );
    displayedIncident.host_name = incident.host_name;
    displayedIncident.container = container;
    displayedIncident.applications = incident.proc_path || null;
    displayedIncident.hostId = incident.host_id || '';
    displayedIncident.hostName = incident.host_name || '';
    displayedIncident.enforcerId = incident.enforcer_id || '';
    displayedIncident.enforcerName = incident.enforcer_name || '';
    displayedIncident.details = this._editIncidentDetails(
      incident,
      source,
      destination
    );
    return displayedIncident;
  };

  getSecurityEvents = () => {
    return GlobalVariable.http.get(PathConstant.SECURITY_EVENTS_URL_2).pipe();
  };

  getContainer = id => {
    return GlobalVariable.http
      .get(PathConstant.CONTAINER_BY_ID, {
        params: { id: id },
      })
      .pipe();
  };

  getHost = id => {
    return GlobalVariable.http
      .get<HostResponse>(PathConstant.NODES_URL, {
        params: { id: id },
      })
      .pipe(map(r => r.host));
  };

  getEnforcer = id => {
    return GlobalVariable.http
      .get<EnforcerResponse>(PathConstant.SINGLE_ENFORCER, {
        params: { id: id },
      })
      .pipe(map(r => r.enforcer));
  };

  getProcess = id => {
    return GlobalVariable.http
      .get(PathConstant.CONTAINER_PROCESS_URL, { params: { id: id } })
      .pipe();
  };

  getIpGeoInfo = (ipList: Array<string>) => {
    return GlobalVariable.http.patch(PathConstant.IP_GEO_URL, ipList).pipe();
  };

  getPacketData = (id: string) => {
    return GlobalVariable.http
      .get<ThreatResponse>(PathConstant.THREAT_URL, { params: { id: id } })
      .pipe(map(r => r.threat));
  };

  getProcessRule = (name: string) => {
    return GlobalVariable.http
      .get<ProcessProfileResponse>(PathConstant.PROCESS_PROFILE_URL, { params: { name: name } })
      .pipe(map(r => r.process_profile));
  };

  updateProcessRule = (payload: any) => {
    return GlobalVariable.http
      .patch(PathConstant.PROCESS_PROFILE_URL, payload)
      .pipe();
  };

  getNetworkRule = (ruleId: number) => {
    return GlobalVariable.http
      .get<PolicyRuleResponse>(PathConstant.POLICY_RULE_URL, { params: { id: ruleId } })
      .pipe(map(r => r.rule));
  };

  updateNetworkRule = (networkRule: any) => {
    return GlobalVariable.http
      .post(PathConstant.POLICY_RULE_URL, networkRule)
      .pipe();
  };

  updateNetworkRuleAction = (id: number, action: string) => {
    return GlobalVariable.http
      .patch(PathConstant.POLICY_RULE_URL, { id: id, action: action })
      .pipe();
  };

  showEnforcerDetails = (ev, enforcerId: string, enforcerName: string) => {
    this.getEnforcer(enforcerId).subscribe(
      (response: any) => {
        this.enforcerModal = this.dialog.open(EnforcerBriefDialogComponent, {
          width: '900px',
          position: { left: '25px', top: '130px' },
          hasBackdrop: false,
          data: {
            enforcer: response,
          },
        });
      },
      error => {}
    );
  };

  prepareContext4TwoWayInfinityScroll = (context: any = null) => {
    console.log(
      'this.securityEventsService.displayedSecurityEvents',
      this.displayedSecurityEvents
    );
    this.dateSliderCtx = {
      page: context?.page || this.page,
      begin: context?.begin || this.begin,
      openedIndex: context?.openedIndex || this.openedIndex,
      openedPage: context?.openedPage || this.openedPage,
      limit: context?.limit || this.limit,
      array: this.displayedSecurityEvents,
    };
  };

  private _getEndpointDirection = (secEvent, type, side) => {
    switch (type) {
      case this.EVENT_TYPE.THREAT:
        if (
          (secEvent.target === this.TARGET.SERVER &&
            side == this.ENDPOINT.SOURCE) ||
          (secEvent.target !== this.TARGET.SERVER &&
            side == this.ENDPOINT.DESTINATION)
        ) {
          return {
            domain_name: secEvent.client_workload_domain || '',
            workload_id: secEvent.client_workload_id || '',
            workload_name: secEvent.client_workload_name || '',
            ip: secEvent.client_ip || '',
            port: secEvent.client_port || 0,
            server_conn_port: 0,
            service: secEvent.client_workload_service || '',
            isHyperlinkEnabled:
              secEvent.client_ip !== secEvent.client_workload_id,
            client_ip: secEvent.client_ip,
          };
        } else {
          return {
            domain_name: secEvent.server_workload_domain || '',
            workload_id: secEvent.server_workload_id || '',
            workload_name: secEvent.server_workload_name || '',
            ip: secEvent.server_ip || '',
            port: secEvent.server_port || 0,
            server_conn_port: secEvent.server_conn_port || 0,
            service: secEvent.server_workload_service || '',
            isHyperlinkEnabled:
              secEvent.server_ip !== secEvent.server_workload_id,
            client_ip: secEvent.client_ip,
          };
        }
      case this.EVENT_TYPE.VIOLATION:
        if (side == this.ENDPOINT.SOURCE) {
          return {
            domain_name: secEvent.client_domain || '',
            workload_id: secEvent.client_id || '',
            workload_name: secEvent.client_name || '',
            ip: secEvent.client_ip || '',
            port: 0,
            server_conn_port: 0,
            service: secEvent.client_service || '',
            isHyperlinkEnabled: secEvent.client_ip !== secEvent.client_id,
            client_ip: secEvent.client_ip,
          };
        } else {
          return {
            domain_name: secEvent.server_domain || '',
            workload_id: secEvent.server_id || '',
            workload_name: secEvent.server_name || '',
            ip: secEvent.server_ip || '',
            port: secEvent.server_port || 0,
            server_conn_port: 0,
            service: secEvent.server_service || '',
            isHyperlinkEnabled: secEvent.server_ip !== secEvent.server_id,
            client_ip: secEvent.client_ip,
          };
        }
      case this.EVENT_TYPE.INCIDENT:
        if (
          (secEvent.conn_ingress && side == this.ENDPOINT.SOURCE) ||
          (!secEvent.conn_ingress && side == this.ENDPOINT.DESTINATION)
        ) {
          return {
            domain_name: secEvent.remote_workload_domain || '',
            workload_id: secEvent.remote_workload_id || '',
            workload_name: secEvent.remote_workload_name || '',
            ip: secEvent.server_ip || '',
            port: secEvent.server_port || 0,
            server_conn_port: secEvent.server_conn_port || 0,
            service: secEvent.remote_workload_service || '',
            isHyperlinkEnabled:
              secEvent.server_ip !== secEvent.remote_workload_id,
            client_ip: secEvent.client_ip,
          };
        } else {
          return {
            domain_name: secEvent.workload_domain || '',
            workload_id: secEvent.workload_id || '',
            workload_name: secEvent.workload_name || '',
            ip: secEvent.client_ip || '',
            port: secEvent.client_port || 0,
            server_conn_port: 0,
            service: secEvent.workload_service || '',
            isHyperlinkEnabled: secEvent.client_ip !== secEvent.workload_id,
            client_ip: secEvent.client_ip,
          };
        }
      default:
        return null;
    }
  };

  private _getEndpointInfo = (endpoint, side, ipMap) => {
    /*
      function: prepareGroup
      description: It only serves for propose rule
    */
    const prepareGroup = function (service, endpointName) {
      if (service) {
        return service === MapConstant.securityEventLocation.EXTERNAL
          ? service //external
          : endpointName.startsWith(MapConstant.securityEventLocation.IP_GROUP)
          ? `nv.ip.${service}`.replace(
              /\/|\?|\%|\&|\s/g,
              ':'
            ) /* Add 'nv.ip.' for IP service */
          : `nv.${service}`.replace(
              /\/|\?|\%|\&|\s/g,
              ':'
            ); /* Add 'nv.' for learnt service */
        // replace(/\/|\?|\%|\&|\s/g, ':') is for resolving irregular symbol in service name
      } else {
        if (
          endpointName.startsWith(MapConstant.securityEventLocation.HOST) //Host format is like Host:<host_name or IP>:host ID
        ) {
          let hostName = endpointName.substring(5);
          if (isIpV4(hostName) || isIpV6(hostName)) {
            return endpointName;
          } else {
            return 'nodes';
          }
        } else if (
          endpointName.startsWith(MapConstant.securityEventLocation.WORKLOAD) // IP workload format is Workload:<workload IP>
        ) {
          let endpointNameParts = endpointName.split(':');
          return `${endpointNameParts[0].trim()}:${endpointNameParts[1].trim()}`;
        } else {
          return ''; //Exception fallback
        }
      }
    };
    if (endpoint.workload_id) {
      let id = endpoint.workload_id;
      let domain = endpoint.domain_name;
      let name = endpoint.workload_name || '';
      let ip = endpoint.ip || '';
      let port = endpoint.port.toString() || '0';
      let server_conn_port = endpoint.server_conn_port.toString() || '0';
      let service = endpoint.service || '';
      let displayName = '';
      let group4Rule = '';
      let endpointOut: any = {
        id: '',
        domain: '',
        icon: '',
        displayName: '',
        externalURL: '',
        service: '',
        countryCode: '',
        countryName: '',
        ip: '',
        group4Rule: '',
        hasDetail: false,
        isHyperlinkEnabled: endpoint.isHyperlinkEnabled,
      };
      if (side === this.ENDPOINT.SOURCE) {
        displayName = getDisplayName(name);
        if (name !== ip && ip) {
          if (displayName) {
            displayName = `${displayName} (${ip})`;
          } else {
            displayName = ip;
          }
        }
        if (id === MapConstant.securityEventLocation.EXTERNAL) {
          if (ip) {
            endpointOut.countryCode = ipMap[ip].country_code.toLowerCase();
            endpointOut.countryName = ipMap[ip].country_name;
            endpointOut.ip = ip;
            displayName = getDisplayName(name);
          }
          endpointOut.externalURL = `https://www.whois.com/whois/${ip}`;
        }
      } else {
        displayName = getDisplayName(name);
        if (name !== ip && ip) {
          if (displayName) {
            displayName = `${displayName} (${ip})`;
          } else {
            displayName = ip;
          }
        }
        if (id === MapConstant.securityEventLocation.EXTERNAL) {
          if (ip) {
            endpointOut.countryCode = ipMap[ip].country_code.toLowerCase();
            endpointOut.countryName = ipMap[ip].country_name;
            endpointOut.ip = ip;
            displayName = getDisplayName(name);
          }
          endpointOut.externalURL = `https://www.whois.com/whois/${ip}`;
        } else {
          displayName = getDisplayName(name);
          if (port === server_conn_port && port) {
            if (displayName) {
              displayName = `${displayName}${port !== '0' ? `:${port}` : ''}`;
            } else {
              displayName = port;
            }
          } else {
            if (displayName) {
              displayName = `${displayName}${port !== '0' ? `:${port}` : ''}${
                server_conn_port !== '0' ? `(${server_conn_port})` : ''
              }`;
            } else {
              displayName = `${port !== '0' ? `${port}` : ''}${
                server_conn_port !== '0' ? `(${server_conn_port})` : ''
              }`;
            }
          }
        }
      }
      if (service) {
        endpointOut.service = service;
      }
      endpointOut.id = id;
      if (name.indexOf(MapConstant.securityEventLocation.HOST) === 0) {
        endpointOut.icon = 'cluster';
        endpointOut.hasDetail = true;
      } else if (
        name.indexOf(MapConstant.securityEventLocation.WORKLOAD) === 0
      ) {
        endpointOut.icon = 'workload';
      } else if (name.indexOf(MapConstant.securityEventLocation.EXTERNAL) === 0)
        endpointOut.icon = 'cloud';
      else if (name.indexOf(MapConstant.securityEventLocation.IP_GROUP) === 0)
        endpointOut.icon = 'system_group';
      else {
        endpointOut.icon = 'workload';
        endpointOut.hasDetail = true;
      }
      endpointOut.displayName = displayName;
      endpointOut.domain = domain;
      endpointOut.group4Rule = prepareGroup(service, name);
      return endpointOut;
    }
    return '';
  };

  private _convertThreatAction = action => {
    if (action.toLowerCase() === 'monitor') return 'alert';
    if (action.toLowerCase() === 'block') return 'deny';
    return action.toLowerCase();
  };

  private _editThreatDetails = (threat, source, destination) => {
    const iconMap = {
      Info: 'fa-info',
      Low: 'fa-support',
      Medium: 'fa-bell',
      High: 'fa-bug',
      Critical: 'fa-bomb',
    };
    let details: any = {
      id: '',
      level: {
        name: '',
        cssColor: '',
      },
      action: {
        name: '',
        name4Pdf: '',
        cssColor: '',
      },
      count: 0,
      clusterName: '',
      message: {
        sourceLink: '',
        destinationLink: '',
        icon: '',
        cssColor: '',
        content: '',
        cap_len: 0,
      },
      labels: [],
    };
    details.id = threat.id;
    details.level.name = threat.level;
    details.level.cssColor =
      `label-${MapConstant.colourMap[threat.level]}` || 'label-info';
    details.action.name = this.utils.getI18Name(
      this._convertThreatAction(threat.action)
    );
    details.action.name4pdf = this._convertThreatAction(threat.action);
    details.action.cssColor =
      `${MapConstant.colourMap[this._convertThreatAction(threat.action)]}` ||
      'info';
    details.count = threat.count;
    details.clusterName = threat.cluster_name;
    details.message.sourceLink = `${source.ip}:${source.port}`;
    details.message.destinationLink = this.sanitizer.sanitize(
      SecurityContext.HTML,
      destination.port !== destination.server_conn_port
        ? `${destination.ip}:${destination.port}(${destination.server_conn_port})`
        : `${destination.ip}:${destination.port}`
    );
    details.message.icon = iconMap[threat.severity];
    details.message.cssColor = MapConstant.colourMap[threat.severity];
    details.message.content = threat.message
      .replace('&amp;', '&')
      .replace('&lt;', '<')
      .replace('&gt;', '>');
    details.message.cap_len = threat.cap_len;
    details.labels.push(this.LABELS.NETWORK);
    return details;
  };

  private _editViolationDetails = violation => {
    let details: any = {
      level: {
        name: '',
        cssColor: '',
      },
      port: 0,
      serverPort: '',
      servers: '',
      serverImage: '',
      clusterName: '',
      action: {
        name: '',
        name4Pdf: '',
        cssColor: '',
      },
      message: {
        cssColor: '',
      },
      labels: [],
    };
    details.level.name = violation.level;
    details.level.cssColor =
      `label-${MapConstant.colourMap[violation.level]}` || 'label-info';
    details.message.cssColor = MapConstant.colourMap[violation.level];
    details.port = violation.server_port || 0;
    details.serverPort = this._getViolationPort(
      violation.ip_proto,
      violation.server_port
    );
    details.serverImage = violation.server_image
      ? violation.server_image
      : null;
    details.clusterName = violation.cluster_name;
    details.action.name = this.utils.getI18Name(violation.policy_action);
    details.action.name4Pdf = violation.policy_action;
    details.action.cssColor =
      MapConstant.colourMap[violation.policy_action] || 'info';
    details.labels.push(this.LABELS.NETWORK);
    return details;
  };

  private getReviewRulePermission = (sourceDomain, destinationDomain) => {
    let sourceDomainPermission = this.authUtilsService.getRowBasedPermission(
      sourceDomain,
      'rt_policy'
    );
    let destinationDomainPermission =
      this.authUtilsService.getRowBasedPermission(
        destinationDomain,
        'rt_policy'
      );
    if (sourceDomainPermission === 'w' && destinationDomainPermission === 'w') {
      return 'w';
    } else if (
      sourceDomainPermission === '' &&
      destinationDomainPermission === ''
    ) {
      return '';
    } else {
      return 'r';
    }
  };

  private _editIncidentDetails = (incident, source, destination) => {
    const iconMap = {
      'Host.File.Modified': 'fa-server',
      'Host.Package.Updated': 'fa-server',
      'Host.Privilege.Escalation': 'fa-server',
      'Host.Suspicious.Process': 'fa-server',
      'Host.Tunnel.Detected': 'fa-server',
      'Host.FileAccess.Violation': 'fa-server',
      'Container.Tunnel.Detected': 'fa-cube',
      'Container.Suspicious.Process': 'fa-cube',
      'Container.Privilege.Escalation': 'fa-cube',
      'Container.File.Modified': 'fa-cube',
      'Container.Package.Updated': 'fa-cube',
      'Container.FileAccess.Violation': 'fa-cube',
    };
    const messageCategoryMap = {
      'Host.File.Modified': 'hostFileModified',
      'Host.Package.Updated': 'hostPackageUpdated',
      'Host.Privilege.Escalation': 'hostPrivilegeEscalation',
      'Container.Privilege.Escalation': 'containerPrivilegeEscalation',
      'Host.Suspicious.Process': 'hostSuspiciousProcess',
      'Container.Suspicious.Process': 'containerSuspiciousProcess',
      'Host.Tunnel.Detected': 'hostTunnelDetected',
      'Container.Tunnel.Detected': 'containerTunnelDetected',
      'Container.File.Modified': 'containerFileModified',
      'Container.Package.Updated': 'containerPackageUpdated',
      'Process.Profile.Violation': 'processProfileViolation',
      'Host.Process.Violation': 'hostProcessViolation',
      'Container.FileAccess.Violation': 'containerFileAccessViolation',
      'Host.FileAccess.Violation': 'hostFileAccessViolation',
    };
    const labelMap = {
      'Host.File.Modified': [this.LABELS.HOST, this.LABELS.FILE],
      'Host.Package.Updated': [this.LABELS.HOST, this.LABELS.PACKAGE],
      'Host.Privilege.Escalation': [this.LABELS.HOST, this.LABELS.PRIVILEGE],
      'Container.Privilege.Escalation': [
        this.LABELS.CONTAINER,
        this.LABELS.PRIVILEGE,
      ],
      'Host.Suspicious.Process': [this.LABELS.HOST, this.LABELS.PROCESS],
      'Container.Suspicious.Process': [
        this.LABELS.CONTAINER,
        this.LABELS.PROCESS,
      ],
      'Host.Tunnel.Detected': [this.LABELS.HOST, this.LABELS.TUNNEL],
      'Container.Tunnel.Detected': [this.LABELS.CONTAINER, this.LABELS.TUNNEL],
      'Container.File.Modified': [this.LABELS.CONTAINER, this.LABELS.FILE],
      'Container.Package.Updated': [this.LABELS.CONTAINER, this.LABELS.PACKAGE],
      'Process.Profile.Violation': [this.LABELS.CONTAINER, this.LABELS.PROCESS],
      'Host.Process.Violation': [this.LABELS.HOST, this.LABELS.PROCESS],
      'Host.FileAccess.Violation': [
        this.LABELS.HOST,
        this.LABELS.PROCESS,
        this.LABELS.FILE,
      ],
      'Container.FileAccess.Violation': [
        this.LABELS.CONTAINER,
        this.LABELS.PROCESS,
        this.LABELS.FILE,
      ],
    };
    const getAction = action => {
      return {
        name: this.utils.getI18Name(action ? action.toUpperCase() : 'ALERT'),
        name4Pdf: action ? action : 'Alert',
        color: action ? action.toLowerCase() : 'alert',
      };
    };
    let action = getAction(incident.action);
    let details: any = {
      level: {
        name: '',
        cssColor: '',
      },
      action: {
        name: '',
        name4Pdf: '',
        cssColor: '',
      },
      clusterName: '',
      message: {
        content: '',
        icon: '',
        cssColor: '',
        group: '',
        procName: '',
        procPath: '',
        procCmd: '',
        procRealUid: '',
        procRealUser: '',
        procEffectiveUid: '',
        procEffectiveUser: '',
        procParentName: '',
        procParentPath: '',
        etherType: '',
        ipProto: '',
        localIP: '',
        remoteIP: '',
        localPort: '',
        remotePort: '',
        filePath: '',
        fileNames: '',
        messageCategory: '',
        labels: [],
        count: 0,
      },
    };
    details.level.name = incident.level;
    details.level.cssColor =
      `label-${MapConstant.colourMap[incident.level]}` || 'label-info';
    details.action.name = action.name;
    details.action.name4Pdf = action.name4Pdf;
    details.action.cssColor = MapConstant.colourMap[action.color];
    details.clusterName = incident.cluster_name;
    details.message.content = incident.message
      .replace('&amp;', '&')
      .replace('&lt;', '<')
      .replace('&gt;', '>');
    details.message.icon = iconMap[incident.name];
    details.message.cssColor = MapConstant.colourMap[incident.level];
    details.message.messageCategory = messageCategoryMap[incident.name];
    details.message.group = incident.group || '';
    details.message.procName = incident.proc_name || '';
    details.message.procPath = incident.proc_path || '';
    details.message.procCmd = incident.proc_cmd || '';
    details.message.procRealUid = incident.proc_real_uid || '';
    details.message.procEffectiveUid = incident.proc_effective_uid || '';
    details.message.procRealUser = incident.proc_real_user || '';
    details.message.procEffectiveUser = incident.proc_effective_user || '';
    details.message.procParentName = incident.proc_parent_name || '';
    details.message.procParentPath = incident.proc_parent_path || '';
    details.message.etherType = incident.ether_type || '';
    details.message.ipProto = incident.ip_proto || '';
    if (
      incident.server_ip &&
      incident.client_ip &&
      incident.server_port &&
      incident.client_port
    ) {
      details.message.localIP = source.ip;
      details.message.remoteIP = destination.ip;
      details.message.localPort = source.port;
      details.message.remotePort = destination.port;
    } else {
      details.message.localIP = '';
      details.message.remoteIP = '';
      details.message.localPort = '';
      details.message.remotePort = '';
    }
    details.message.filePath = incident.file_path || '';
    details.message.fileNames = incident.file_name
      ? incident.file_name.join(', ')
      : '';
    details.message.count = incident.count ? incident.count : 0;
    details.labels = labelMap[incident.name];
    return details;
  };

  private _getViolationPort = (ipProto, port) => {
    let protocol = ipProto;
    if (protocol === 1) return 'icmp';
    else if (protocol === 6) return 'tcp/' + port;
    else if (protocol === 17) return 'udp/' + port;
    else return port;
  };
}
