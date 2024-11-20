import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { SecurityEventsService } from '@services/security-events.service';
import { MapConstant } from '@common/constants/map.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AdvancedFilterModalComponent } from './partial/advanced-filter-modal/advanced-filter-modal.component';
import { PacketModalComponent } from './partial/packet-modal/packet-modal.component';
import { NodeBriefDialogComponent } from '@components/node-brief/node-brief-dialog/node-brief-dialog.component';
import { PodBriefDialogComponent } from '@components/pod-brief/pod-brief-dialog/pod-brief-dialog.component';
import { ReviewNetworkRuleModalComponent } from './partial/review-network-rule-modal/review-network-rule-modal.component';
import { ReviewProcessRuleModalComponent } from './partial/review-process-rule-modal/review-process-rule-modal.component';
import {
  AdvancedFilterModalService,
  FilterSeverity,
  FilterLocation,
  FilterCategory,
  Other,
} from './partial/advanced-filter-modal/advanced-filter-modal.service';
import { TranslateService } from '@ngx-translate/core';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import _ from 'lodash';

@Component({
  selector: 'app-security-events',
  templateUrl: './security-events.component.html',
  styleUrls: ['./security-events.component.scss'],
})
export class SecurityEventsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  threatList: any;
  violationList: any;
  incidentList: any;
  domainList: Array<any> = [];
  isDataReady: boolean = false;
  secEventsErr: boolean = false;
  selectedRow: any;
  filter = new FormControl('');
  advFilterConf: any = null;
  filterOpen: boolean = false;

  filterDialog!: MatDialogRef<any>;
  advFilter: any = this.advancedFilterModalService.advFilter;
  autoComplete!: {
    domain: string[];
    host: string[];
    source: string[];
    destination: string[];
  };
  displayedSecurityEventsJsonBeforeApplyAdvFilter: string = '[]';
  packetModal!: MatDialogRef<any>;
  hostModal!: MatDialogRef<any>;
  podModal!: MatDialogRef<any>;
  reviewProcessRuleModal!: MatDialogRef<any>;
  reviewNetworkRuleModal!: MatDialogRef<any>;
  isEditRuleAuthorized: boolean = false;
  isUpdateRuleAuthorized: boolean = false;
  metadata: any;
  printableData: any[] = [];
  isPrinting: boolean = false;
  rowLimit4Report: number = MapConstant.REPORT_TABLE_ROW_LIMIT;
  autoRefreshInterval;
  AUTO_FREFRESH_INTERVAL = 60000;

  @ViewChild('securityEventsPrintableReport') printableReportView!: ElementRef;

  constructor(
    public securityEventsService: SecurityEventsService,
    private authUtilsService: AuthUtilsService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    public dialog: MatDialog,
    private advancedFilterModalService: AdvancedFilterModalService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.isEditRuleAuthorized =
      this.authUtilsService.getDisplayFlag('review_rule');
    this.isUpdateRuleAuthorized =
      this.authUtilsService.getDisplayFlag('update_rule');
    this.route.paramMap.pipe().subscribe(rep => {
      this.selectedRow = String(rep.get('selectedRow'));
      this.refresh();
    });

    this.metadata = {
      title: this.translate.instant('securityEvent.pdf.REPORT_TITLE'),
      header: {
        id: this.translate.instant('securityEvent.pdf.ID'),
        title: this.translate.instant('securityEvent.pdf.TITLE'),
        severity: this.translate.instant('securityEvent.pdf.SEVERITY'),
        location: this.translate.instant('securityEvent.pdf.LOCATION'),
        details: this.translate.instant('securityEvent.pdf.DETAILS'),
        action: this.translate.instant('securityEvent.pdf.ACTION'),
        datetime: this.translate.instant('securityEvent.pdf.DATETIME'),
      },
      items: {
        source: this.translate.instant('securityEvent.SOURCE'),
        destination: this.translate.instant('securityEvent.DESTINATION'),
        host: this.translate.instant('securityEvent.HOST'),
        container: this.translate.instant('securityEvent.CONTAINER'),
        applications: this.translate.instant('securityEvent.APPLICATIONS'),
        count: this.translate.instant('threat.gridHeader.COUNT'),
        description: this.translate.instant('securityEvent.DESCRIPTION'),
        serverPort: this.translate.instant('violation.gridHeader.SERVER_PORT'),
        protocol: this.translate.instant('violation.gridHeader.PROTOCOL'),
        serverImage: this.translate.instant(
          'violation.gridHeader.SERVER_IMAGE'
        ),
        clusterName: this.translate.instant(
          'violation.gridHeader.CLUSTER_NAME'
        ),
        group: this.translate.instant('securityEvent.GROUP'),
        procName: this.translate.instant('securityEvent.PROC_NAME'),
        procPath: this.translate.instant('securityEvent.PROC_PATH'),
        procCmd: this.translate.instant('securityEvent.PROC_CMD'),
        cmd: this.translate.instant('securityEvent.CMD'),
        procEffectedUid: this.translate.instant('securityEvent.PROC_EFF_UID'),
        procEffectedUser: this.translate.instant('securityEvent.PROC_EFF_USER'),
        localIp: this.translate.instant('securityEvent.LOCAL_IP'),
        remoteIp: this.translate.instant('securityEvent.REMOTE_IP'),
        localPort: this.translate.instant('securityEvent.LOCAL_PORT'),
        remotePort: this.translate.instant('securityEvent.REMOTE_PORT'),
        ipProto: this.translate.instant('securityEvent.IP_PROTO'),
        fileNames: this.translate.instant('securityEvent.FILE_NAME'),
        filePath: this.translate.instant('securityEvent.FILE_PATH'),
      },
      others: {
        tocText: this.translate.instant('general.REPORT_TOC'),
        headerText: this.translate.instant('partner.securityEvent.pdf.header'),
        footerText: this.translate.instant('securityEvent.pdf.FOOTER'),
        subTitleDetails: this.translate.instant('securityEvent.pdf.DETAILS'),
        reportSummary: this.translate.instant('enum.SUMMARY'),
        logoName: this.translate.instant('partner.general.LOGO_NAME'),
        byEventType: this.translate.instant('securityEvent.pdf.TYPEDIST'),
      },
    };
    this.autoRefresh();
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.advancedFilterModalService.resetFilter();
    clearInterval(this.autoRefreshInterval);
  }

  autoRefresh = () => {
    this.autoRefreshInterval = setInterval(() => {
      this.preprocessSecurityEventsData();
    }, this.AUTO_FREFRESH_INTERVAL);
  };

  refresh = () => {
    this.isDataReady = false;
    this.securityEventsService.displayedSecurityEvents = [];
    this.printableData = [];
    this.securityEventsService.cachedSecurityEvents = [];
    this.preprocessSecurityEventsData();
  };

  preprocessSecurityEventsData = () => {
    this.securityEventsService.getSecurityEvents().subscribe(
      (response: any) => {
        this.combineSecurityEvents(response);
      },
      error => {
        console.error(error);
      }
    );
  };

  getOpenedRec = (evt, index, page) => {
    if (evt.target.checked) {
      this.securityEventsService.dateSliderCtx.openedIndex = index;
      this.securityEventsService.dateSliderCtx.openedPage = page;
    } else {
      this.securityEventsService.dateSliderCtx.openedIndex = -1;
      this.securityEventsService.dateSliderCtx.openedPage = -1;
    }
  };

  isTooltipDisabled = e => {
    return e.scrollWidth <= e.clientWidth;
  };

  canShowReviewRule = secEvent => {
    let srcGroup = secEvent.endpoint.source.group4Rule;
    let destGroup = secEvent.endpoint.destination.group4Rule;
    return srcGroup.length > 0 && destGroup.length > 0;
  };

  showContainerDetails = (ev, endpoint, hostName: string): void => {
    if (
      endpoint.displayName &&
      endpoint.displayName.startsWith(MapConstant.securityEventLocation.HOST)
    ) {
      this.showHostDetails(ev, endpoint.id.substring(5), hostName);
      return;
    }
    ev.stopPropagation();

    this.securityEventsService.getContainer(endpoint.id).subscribe(
      (response: any) => {
        this.podModal = this.dialog.open(PodBriefDialogComponent, {
          width: '900px',
          position: { left: '25px', top: '130px' },
          hasBackdrop: false,
          data: {
            pod: response,
          },
        });
      },
      error => {}
    );
  };

  showHostDetails = (ev, hostId: string, hostName: string): void => {
    ev.stopPropagation();
    this.securityEventsService.getHost(hostId).subscribe(
      (response: any) => {
        this.hostModal = this.dialog.open(NodeBriefDialogComponent, {
          width: '675px',
          position: { left: '25px', top: '130px' },
          hasBackdrop: false,
          data: response,
        });
      },
      error => {}
    );
  };

  isInternalGroup = function (group: string): boolean {
    return MapConstant.INTERNAL_GROUPS.includes(group);
  };

  showPacket = (id: string, ev): void => {
    console.log('Threat ID', id);
    this.securityEventsService.getPacketData(id).subscribe(
      (response: any) => {
        this.packetModal = this.dialog.open(PacketModalComponent, {
          width: '675px',
          data: {
            packet: response.packet,
          },
        });
      },
      error => {}
    );
  };

  reviewRule = (eventType: string, secEvent: any): void => {
    switch (eventType) {
      case 'incident':
        this.openReviewProcessRuleModal(secEvent);
        break;
      case 'violation':
        this.openReviewNetworkRuleModal(secEvent);
        break;
    }
  };

  openAdvancedFilterDialog = () => {
    if (!this.filterOpen) {
      this.filterOpen = true;
      this.filterDialog = this.dialog.open(AdvancedFilterModalComponent, {
        width: '675px',
        data: {
          filter: this.advFilter,
          domains: this.autoComplete.domain,
          hosts: this.autoComplete.host,
          sources: this.autoComplete.source,
          destinations: this.autoComplete.destination,
        },
        hasBackdrop: false,
        position: { right: '25px', top: '80px' },
      });

      this.filterDialog.afterClosed().subscribe(
        filter => {
          this.advFilterConf = filter;
          console.log(filter);
          if (filter && filter.reset) {
            this.advancedFilterModalService.resetFilter();
            this.setAdvancedFilter();
            this.advFilterConf = null;
            if (this.displayedSecurityEventsJsonBeforeApplyAdvFilter !== '[]') {
              this.securityEventsService.displayedSecurityEvents = JSON.parse(
                this.displayedSecurityEventsJsonBeforeApplyAdvFilter
              );
            }
            this.onQuickFilterChange(this.filter.value || '');
          } else if (filter) {
            filter.severity = this.getSeverities(filter.severity);
            filter.location = this.getLocations(filter.location);
            filter.category = this.getCategories(filter.category);
            filter.other = this.getOther(filter.other);
            this.setAdvancedFilter(filter);
            this.onQuickFilterChange(this.filter.value || '');
          }
        },
        error => {},
        () => {
          this.filterOpen = false;
        }
      );
    }
  };

  onQuickFilterChange = (filterStr: string) => {
    this.securityEventsService.displayedSecurityEvents = (
      this.advFilterConf
        ? this.securityEventsService.displayedSecurityEvents
        : this.securityEventsService.cachedSecurityEvents
    ).filter(event => {
      return this.advancedFilterModalService._includeFilter(event, filterStr);
    });
    this.printableData = this.getPrintableData(
      this.securityEventsService.displayedSecurityEvents
    );
    this.securityEventsService.prepareContext4TwoWayInfinityScroll();
  };

  closeDetails = elemId => {
    document.getElementById(elemId)!['checked'] = false;
    this.securityEventsService.dateSliderCtx.openedIndex = -1;
    this.securityEventsService.dateSliderCtx.openedPage = -1;
  };

  exportCSV = () => {
    let csvData = this.getCsvData(
      this.securityEventsService.displayedSecurityEvents
    );
    let csv = arrayToCsv(JSON.parse(JSON.stringify(csvData)));
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'Security_events.csv');
  };

  printReport = () => {
    this.isPrinting = true;
    setInterval(() => {
      if (this.printableReportView) {
        window.print();
        this.isPrinting = false;
      }
    }, 500);
  };

  private getCsvData = secEvents => {
    return secEvents.map((secEvent, $index) => {
      return this._organizeSecEventTblRow(secEvent, $index, 'csv');
    });
  };

  private getPrintableData = secEvents => {
    return secEvents.map((secEvent, $index) => {
      return this._organizeSecEventTblRow(secEvent, $index, 'printable');
    });
  };

  private _organizeSecEventTblRow = (
    secEvent: any,
    index: number,
    format: string
  ) => {
    let resPrototype = {
      ID: '',
      Title: '',
      Severity: '',
      Location: '',
      Details: '',
      Action: '',
      Datetime: '',
    };
    const lineBreak = format === 'csv' ? '\n' : '<br/>';
    resPrototype.ID = (index + 1).toString();
    resPrototype.Title = `${secEvent.name.replace(/\"/g, "'")}`;
    resPrototype.Severity = secEvent.details.level
      ? secEvent.details.level.name
      : '';
    resPrototype.Location = `${this._organizeLocation(
      secEvent
    ).stack[0].ul.join(lineBreak)}`;
    resPrototype.Details = `${this._organizeSecEventDetails(secEvent)!
      .stack.map(function (elem) {
        return typeof elem === 'string' ? elem : elem.ul.join(lineBreak);
      })
      .join(lineBreak)
      .replace(/\"/g, "'")}`;
    resPrototype.Action = secEvent.details.action
      ? secEvent.details.action.name
      : '';
    resPrototype.Datetime = `${secEvent.reportedAt}`;
    return resPrototype;
  };

  private _organizeLocation = (secEvent: any) => {
    if (secEvent.endpoint.source && secEvent.endpoint.destination) {
      return {
        stack: [
          {
            ul: [
              `${this.metadata.items.source}: ${
                secEvent.endpoint.source.domain
                  ? `${secEvent.endpoint.source.domain}: `
                  : ''
              }${secEvent.endpoint.source.displayName}`,
              `${this.metadata.items.destination}: ${
                secEvent.endpoint.destination.domain
                  ? `${secEvent.endpoint.destination.domain}: `
                  : ''
              }${secEvent.endpoint.destination.displayName} (${
                secEvent.endpoint.destination.ip
              })`,
            ],
          },
        ],
      };
    } else if (
      secEvent.endpoint.source &&
      !secEvent.details.labels.includes('host')
    ) {
      return {
        stack: [
          {
            ul: [
              `${this.metadata.items.host}: ${secEvent.host_name}`,
              `${this.metadata.items.container}: ${
                secEvent.endpoint.source.domain
                  ? `${secEvent.endpoint.source.domain}: `
                  : ''
              }${secEvent.endpoint.source.displayName}`,
            ],
          },
        ],
      };
    } else if (
      secEvent.endpoint.destination &&
      !secEvent.details.labels.includes('host')
    ) {
      return {
        stack: [
          {
            ul: [
              `${this.metadata.items.host}: ${secEvent.host_name}`,
              `${this.metadata.items.container}: ${
                secEvent.endpoint.destination.domain
                  ? `${secEvent.endpoint.destination.domain}: `
                  : ''
              }${secEvent.endpoint.destination.displayName}`,
            ],
          },
        ],
      };
    } else {
      return {
        stack: [
          {
            ul: [`${this.metadata.items.host}: ${secEvent.host_name}`],
          },
        ],
      };
    }
  };

  private _organizeSecEventDetails = (secEvent: any) => {
    let ul: any[] = [];

    switch (secEvent.type.name) {
      case 'threat':
        if (secEvent.details.clusterName)
          ul.push(
            `${this.metadata.items.clusterName}: ${secEvent.details.clusterName}`
          );
        if (secEvent.applications)
          ul.push(
            `${this.metadata.items.applications}: ${secEvent.applications}`
          );
        if (secEvent.details.count)
          ul.push(`${this.metadata.items.count}: ${secEvent.details.count}`);
        if (secEvent.details.message.content)
          ul.push(
            `${this.metadata.items.description}: ${secEvent.details.message.content}`
          );
        return { stack: [{ ul: ul }] };
      case 'violation':
        if (secEvent.details.clusterName)
          ul.push(
            `${this.metadata.items.clusterName}: ${secEvent.details.clusterName}`
          );
        if (secEvent.applications)
          ul.push(
            `${this.metadata.items.applications}: ${secEvent.applications}`
          );
        if (secEvent.details.serverPort)
          ul.push(
            `${
              secEvent.details.port > 0
                ? this.metadata.items.serverPort
                : this.metadata.items.protocol
            }: ${secEvent.details.serverPort}`
          );
        if (secEvent.details.serverImage)
          ul.push(
            `${this.metadata.items.serverImage}: ${secEvent.details.serverImage}`
          );
        return { stack: [{ ul: ul }] };
      case 'incident':
        if (secEvent.details.clusterName)
          ul.push(
            `${this.metadata.items.clusterName}: ${secEvent.details.clusterName}`
          );
        if (secEvent.details.message.group)
          ul.push(
            `${this.metadata.items.group}: ${secEvent.details.message.group}`
          );
        if (secEvent.details.message.procName)
          ul.push(
            `${this.metadata.items.procName}: ${secEvent.details.message.procName}`
          );
        if (secEvent.details.message.procPath)
          ul.push(
            `${this.metadata.items.procPath}: ${secEvent.details.message.procPath}`
          );
        if (secEvent.details.message.procCmd)
          ul.push(
            `${this.metadata.items.procCmd}: ${secEvent.details.message.procCmd}`
          );
        if (
          secEvent.details.message.procCmd &&
          secEvent.name.toLowerCase().indexOf('process') < 0 &&
          secEvent.name.toLowerCase().indexOf('escalation') < 0 &&
          secEvent.name.toLowerCase().indexOf('detected') < 0
        )
          ul.push(
            `${this.metadata.items.cmd}: ${secEvent.details.message.procCmd}`
          );
        if (secEvent.details.message.procEffectiveUid)
          ul.push(
            `${this.metadata.items.procEffectedUid}: ${secEvent.details.message.procEffectiveUid}`
          );
        if (secEvent.details.message.procEffectiveUser)
          ul.push(
            `${this.metadata.items.procEffectedUser}: ${secEvent.details.message.procEffectiveUser}`
          );
        if (secEvent.details.message.localIP)
          ul.push(
            `${this.metadata.items.localIp}: ${secEvent.details.message.localIP}`
          );
        if (secEvent.details.message.remoteIP)
          ul.push(
            `${this.metadata.items.remoteIp}: ${secEvent.details.message.remoteIP}`
          );
        if (secEvent.details.message.localPort)
          ul.push(
            `${this.metadata.items.localPort}: ${secEvent.details.message.localPort}`
          );
        if (secEvent.details.message.localPort)
          ul.push(
            `${this.metadata.items.remotePort}: ${secEvent.details.message.localPort}`
          );
        if (secEvent.details.message.ipProto)
          ul.push(
            `${this.metadata.items.ipProto}: ${secEvent.details.message.ipProto}`
          );
        if (secEvent.details.message.filePath)
          ul.push(
            `${this.metadata.items.filePath}: ${secEvent.details.message.filePath}`
          );
        if (secEvent.details.message.fileNames)
          ul.push(
            `${this.metadata.items.fileNames}: ${secEvent.details.message.fileNames}`
          );
        return {
          stack: [secEvent.details.message.content, { ul: ul }],
        };
      default:
        return null;
    }
  };

  private openReviewProcessRuleModal = (secEvent: any) => {
    this.securityEventsService
      .getProcessRule(secEvent.details.message.group)
      .subscribe(
        (response: any) => {
          let processRule = response.process_list.filter(rule => {
            return (
              rule.name === secEvent.details.message.procName &&
              rule.path === secEvent.details.message.procPath
            );
          });
          this.reviewProcessRuleModal = this.dialog.open(
            ReviewProcessRuleModalComponent,
            {
              width: '900px',
              data: {
                isEditable: this.isUpdateRuleAuthorized,
                secEvent: secEvent,
                processRule: processRule,
              },
              hasBackdrop: false,
            }
          );
        },
        error => {}
      );
  };

  private openReviewNetworkRuleModal = (secEvent: any) => {
    const success = (response: any = {}) => {
      let networkRule = response;
      networkRule.allowed = networkRule.action
        ? networkRule.action === 'allow'
        : true;
      this.reviewNetworkRuleModal = this.dialog.open(
        ReviewNetworkRuleModalComponent,
        {
          width: '900px',
          data: {
            isEditable: this.isUpdateRuleAuthorized,
            networkRule: networkRule,
            secEvent: secEvent,
          },
          hasBackdrop: false,
        }
      );
    };
    if (secEvent.ruleId === 0) {
      success();
    } else {
      this.securityEventsService.getNetworkRule(secEvent.ruleId).subscribe(
        (response: any) => {
          success(response);
        },
        error => {}
      );
    }
  };

  private prepareAutoCompleteData = cachedSecurityEvents => {
    this.autoComplete = {
      domain: this.domainList,
      host: this.getAutoCompleteData(e => e.hostName, cachedSecurityEvents),
      source: this.getAutoCompleteData(
        e => e.endpoint.source.displayName,
        cachedSecurityEvents
      ),
      destination: this.getAutoCompleteData(
        e => e.endpoint.destination.displayName,
        cachedSecurityEvents
      ),
    };
  };

  private getAutoCompleteData = (
    cb: (e: any) => any,
    secEvents: Array<any>
  ): string[] => {
    return Array.from(new Set(secEvents.map(e => cb(e))))
      .filter(s => !!s)
      .sort();
  };

  private setAdvancedFilter = (filter?: any) => {
    if (filter && !filter.reset) {
      this.advancedFilterModalService.advFilter = filter;
    }
    if (this.displayedSecurityEventsJsonBeforeApplyAdvFilter !== '[]') {
      this.securityEventsService.displayedSecurityEvents = JSON.parse(
        this.displayedSecurityEventsJsonBeforeApplyAdvFilter
      );
    }
    this.advFilter = this.advancedFilterModalService.advFilter;
    this.displayedSecurityEventsJsonBeforeApplyAdvFilter = JSON.stringify(
      this.securityEventsService.displayedSecurityEvents
    );
    this.securityEventsService.displayedSecurityEvents =
      this.securityEventsService.displayedSecurityEvents.filter(event =>
        this.advancedFilterModalService.filterFn(event)
      );
    this.printableData = this.getPrintableData(
      this.securityEventsService.displayedSecurityEvents
    );
    this.securityEventsService.prepareContext4TwoWayInfinityScroll();
  };

  private getSeverities = (severities: boolean[]) => {
    let _severities = [] as any;
    severities.forEach((severity, idx) => {
      if (severity) _severities.push(Object.values(FilterSeverity)[idx]);
    });
    return _severities;
  };

  private getLocations = (locations: boolean[]) => {
    let _locations = [] as any;
    locations.forEach((location, idx) => {
      if (location) _locations.push(Object.values(FilterLocation)[idx]);
    });
    return _locations;
  };

  private getCategories = (categories: boolean[]) => {
    let _categories = [] as any;
    categories.forEach((category, idx) => {
      if (category) _categories.push(Object.values(FilterCategory)[idx]);
    });
    return _categories;
  };

  private getOther = (other: boolean[]) => {
    let _other = [] as any;
    other.forEach((otherElem, idx) => {
      if (otherElem) _other.push(Object.values(Other)[idx]);
    });
    return _other;
  };

  private combineSecurityEvents = securityEventsData => {
    let startTime = new Date().getTime();
    this.threatList = JSON.parse(securityEventsData[0]);
    this.violationList = JSON.parse(securityEventsData[1]);
    this.incidentList = JSON.parse(securityEventsData[2]);
    let parseDataTime: number = new Date().getTime();
    console.log('Profile - Parse data: ', parseDataTime - startTime);

    console.log('Security Events (raw): ', [
      this.threatList,
      this.violationList,
      this.incidentList,
    ]);

    let ipList = this.threatList.threats
      .flatMap((threat: any) => {
        let ips: Array<string> = [];
        if (
          threat.client_workload_id ===
          MapConstant.securityEventLocation.EXTERNAL
        ) {
          ips.push(threat.client_ip);
        }
        if (
          threat.server_workload_id ===
          MapConstant.securityEventLocation.EXTERNAL
        ) {
          ips.push(threat.server_ip);
        }
        return ips;
      })
      .concat(
        this.violationList.violations.flatMap((violation: any) => {
          let ips: Array<string> = [];
          if (
            violation.client_id === MapConstant.securityEventLocation.EXTERNAL
          ) {
            ips.push(violation.client_ip);
          }
          if (
            violation.server_id === MapConstant.securityEventLocation.EXTERNAL
          ) {
            ips.push(violation.server_ip);
          }
          return ips;
        })
      )
      .concat(
        this.incidentList.incidents.flatMap((incident: any) => {
          let ips: Array<string> = [];
          if (
            incident.workload_id === MapConstant.securityEventLocation.EXTERNAL
          ) {
            ips.push(incident.client_ip);
          }
          if (
            incident.remote_workload_id ===
            MapConstant.securityEventLocation.EXTERNAL
          ) {
            ips.push(incident.server_ip);
          }
          return ips;
        })
      );
    console.log('IP list: ', ipList);

    let getIpListTime = new Date().getTime();
    console.log('Profile - Get ip list: ', getIpListTime - parseDataTime);

    this.securityEventsService.getIpGeoInfo(ipList).subscribe(
      (response: any) => {
        let getIpGeoInfoTime = new Date().getTime();
        console.log(
          'Profile - Get ip geo info: ',
          getIpGeoInfoTime - getIpListTime
        );

        let ipMap = response.ip_map;
        this.threatList = this.threatList.threats.map((threat: any) => {
          return this.securityEventsService.editDisplayedThreat(threat, ipMap);
        });
        this.violationList = this.violationList.violations.map(
          (violation: any) => {
            return this.securityEventsService.editDisplayedViolation(
              violation,
              ipMap
            );
          }
        );
        this.incidentList = this.incidentList.incidents.map((incident: any) => {
          return this.securityEventsService.editDisplayedIncident(
            incident,
            ipMap
          );
        });

        let editSecEventTime = new Date().getTime();
        console.log(
          'Profile - Edit sec event time: ',
          editSecEventTime - getIpGeoInfoTime
        );

        let mergedSecEvents = []
          .concat(this.threatList)
          .concat(this.violationList)
          .concat(this.incidentList);

        this.securityEventsService.cachedSecurityEvents =
          _.cloneDeep(mergedSecEvents);

        let mergeSecEventTime = new Date().getTime();
        console.log(
          'Profile - Merge sec event time: ',
          mergeSecEventTime - editSecEventTime
        );

        if (this.securityEventsService.cachedSecurityEvents.length > 0) {
          let sortingStartTime = new Date().getTime();
          this.securityEventsService.cachedSecurityEvents =
            this.securityEventsService.cachedSecurityEvents.sort((a, b) => {
              return b.reportedTimestamp - a.reportedTimestamp;
            });

          let sortSecEventTime = new Date().getTime();
          console.log(
            'Profile - Sort sec event time: ',
            sortSecEventTime - mergeSecEventTime
          );

          console.log(
            'Security Events (After edited): ',
            JSON.parse(
              JSON.stringify(this.securityEventsService.cachedSecurityEvents)
            )
          );

          this.domainList = this._getDomainList(
            this.securityEventsService.cachedSecurityEvents
          );
          this.prepareAutoCompleteData(
            this.securityEventsService.cachedSecurityEvents
          );

          if (this.selectedRow && this.selectedRow !== 'null') {
            this.onQuickFilterChange(
              this.datePipe.transform(
                this.selectedRow.reported_at,
                'MMM dd, yyyy HH:mm:ss'
              )!
            );
          } else {
            this.securityEventsService.displayedSecurityEvents = _.cloneDeep(
              this.securityEventsService.cachedSecurityEvents
            );
            this.printableData = this.getPrintableData(
              this.securityEventsService.displayedSecurityEvents
            );
          }
        }
        this.securityEventsService.displayedSecurityEvents =
          this.securityEventsService.displayedSecurityEvents.filter(event => {
            return this.advancedFilterModalService._includeFilter(
              event,
              this.filter.value || ''
            );
          });
        console.log('this.advFilterConf', this.advFilterConf);
        this.setAdvancedFilter(this.advFilterConf);
        this.onQuickFilterChange(this.filter.value || '');
        this.isDataReady = true;
      },
      error => {}
    );
  };

  private _getDomainList = allSecurityEvents => {
    let domainSet = new Set();
    allSecurityEvents.forEach(event => {
      if (event.endpoint.source && event.endpoint.source.domain) {
        domainSet.add(event.endpoint.source.domain);
      }
      if (event.endpoint.destination && event.endpoint.destination.domain) {
        domainSet.add(event.endpoint.destination.domain);
      }
    });
    console.log('Domain set: ', domainSet);
    return Array.from(domainSet);
  };
}
