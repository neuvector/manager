import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SecurityEventsService } from '@services/security-events.service';
import { MapConstant } from '@common/constants/map.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
  Other
} from './partial/advanced-filter-modal/advanced-filter-modal.service';

@Component({
  selector: 'app-security-events',
  templateUrl: './security-events.component.html',
  styleUrls: ['./security-events.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityEventsComponent implements OnInit {

  threatList: any;
  violationList: any;
  incidentList: any;
  domainList: Array<any> = new Array();
  isDataReady: boolean = false;
  secEventsErr: boolean = false;
  selectedRow: any;
  filter = new FormControl('');
  filterOpen: boolean = false;

  filterDialog!: MatDialogRef<any>;
  advFilter: any = this.advancedFilterModalService.advFilter;
  autoComplete!: {
    domain: string[];
    host: string[];
    source: string[];
    destination: string[]
  };
  displayedSecurityEventsJsonBeforeApplyAdvFilter: string = '[]';
  packetModal: MatDialogRef<any>;
  hostModal: MatDialogRef<any>;
  podModal: MatDialogRef<any>;
  reviewProcessRuleModal: MatDialogRef<any>;
  reviewNetworkRuleModal: MatDialogRef<any>;
  isEditRuleAuthorized: boolean;
  isUpdateRuleAuthorized: boolean;

  constructor(
    public securityEventsService: SecurityEventsService,
    private authUtilsService: AuthUtilsService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    public dialog: MatDialog,
    private advancedFilterModalService: AdvancedFilterModalService,
  ) { }

  ngOnInit(): void {
    this.isEditRuleAuthorized = this.authUtilsService.getDisplayFlag("review_rule");
    this.isUpdateRuleAuthorized = this.authUtilsService.getDisplayFlag("update_rule");
    this.route.paramMap.pipe().subscribe(rep => {
        this.selectedRow = String(rep.get('selectedRow'));
        console.log('this.selectedRow', this.selectedRow);
        this.refresh();
    });
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  refresh = () => {
    this.securityEventsService.displayedSecurityEvents = [];
    this.securityEventsService.cachedSecurityEvents = [];
    this.preprosessSecurityEventsData();
  };

  preprosessSecurityEventsData = () => {
    this.securityEventsService.getSecurityEvents()
      .subscribe(
        (response: any) => {
          this.combineSecurityEvents(response);
        },
        error => {}
      );
  };

  getOpenedRec = (evt, index, page) => {
    // console.log('Before: ', $scope.openedIndex, $scope.openedPage)
    if (evt.target.checked) {
      this.securityEventsService.dateSliderCtx.openedIndex = index;
      this.securityEventsService.dateSliderCtx.openedPage = page;
    } else {
      this.securityEventsService.dateSliderCtx.openedIndex = -1;
      this.securityEventsService.dateSliderCtx.openedPage = -1;
    }
    // console.log('After: ', $scope.openedIndex, $scope.openedPage)
  };

  isTooltipDisabled = e => {
    return e.scrollWidth <= e.clientWidth;
  };

  canShowReviewRule = (secEvent) => {
    let srcGroup = secEvent.endpoint.source.group4Rule;
    let destGroup = secEvent.endpoint.destination.group4Rule;
    return srcGroup.length > 0 && destGroup.length > 0;
  };



  showContainerDetails = (ev, endpoint, hostName: string): void => {
    if (endpoint.displayName && endpoint.displayName.startsWith(MapConstant.securityEventLocation.HOST)) {
      this.showHostDetails(
        ev,
        endpoint.id.substring(5),
        hostName
      );
      return;
    }
    ev.stopPropagation();

    this.securityEventsService.getContainer(endpoint.id)
      .subscribe(
        (response: any) => {
          this.podModal = this.dialog.open(PodBriefDialogComponent, {
            width: '900px',
            position: { left: '25px', top: '130px' },
            hasBackdrop: false,
            data: {
              pod: response
            }
          });
        },
        error => {}
      );
  };

  showHostDetails = (ev, hostId: string, hostName: string): void => {
    ev.stopPropagation();
    this.securityEventsService.getHost(hostId)
      .subscribe(
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

  isInternalGroup = function(group: string): boolean {
    return MapConstant.INTERNAL_GROUPS.includes(group);
  };

  showPacket = (id: string, ev): void => {
    console.log('Threat ID', id);
    this.securityEventsService.getPacketData(id)
      .subscribe(
        (response: any) => {
          this.packetModal = this.dialog.open(PacketModalComponent, {
            width: '675px',
            data: {
              packet: response.packet
            },
          });
        },
        error => {}
      );
  };

  reviewRule = (eventType: string, secEvent: any): void => {
    switch(eventType) {
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
          destinations: this.autoComplete.destination
        },
        hasBackdrop: false,
        position: { right: '25px', top: '80px' },
      });

      this.filterDialog.afterClosed().subscribe(filter => {
        console.log(filter);
        if (filter && filter.reset) {
          this.advancedFilterModalService.resetFilter();
          this.setAdvancedFilter();
        } else if (filter) {
          filter.severity = this.getSeverities(filter.severity);
          filter.location = this.getLocations(filter.location);
          filter.category = this.getCategories(filter.category);
          filter.other = this.getOther(filter.other);
          this.setAdvancedFilter(filter);
        }
        this.filterOpen = false;
      });
    }
  };

  onQuickFilterChange = (filterStr: string) => {
    this.securityEventsService.displayedSecurityEvents = this.securityEventsService.cachedSecurityEvents.filter(event => {
      return this.advancedFilterModalService._includeFilter(event, filterStr);
    });
    this.securityEventsService.prepareContext4TwoWayInfinityScroll();
  };

  closeDetails = (elemId) => {
    document.getElementById(elemId)!['checked'] = false;
    this.securityEventsService.dateSliderCtx.openedIndex = -1;
    this.securityEventsService.dateSliderCtx.openedPage = -1;
  };

  private openReviewProcessRuleModal = (secEvent: any) => {
    this.securityEventsService.getProcessRule(secEvent.details.message.group)
      .subscribe(
        (response: any) => {
          let processRule = response.process_list.filter(
            rule => {
              return (
                rule.name === secEvent.details.message.procName &&
                rule.path === secEvent.details.message.procPath
              );
            }
          );
          this.reviewProcessRuleModal = this.dialog.open(ReviewProcessRuleModalComponent, {
            width: '900px',
            data: {
              isEditable: this.isUpdateRuleAuthorized,
              secEvent: secEvent,
              processRule: processRule
            },
            hasBackdrop: false,
            disableClose: true
          });
        },
        error => {}
      );
  };

  private openReviewNetworkRuleModal = (secEvent: any) => {
    this.securityEventsService.getNetworkRule(secEvent.ruleId)
      .subscribe(
        (response: any) => {
          let networkRule = response;
          networkRule.allowed = networkRule.action === 'allow';
          this.reviewNetworkRuleModal = this.dialog.open(ReviewNetworkRuleModalComponent, {
            width: '900px',
            data: {
              isEditable: this.isUpdateRuleAuthorized,
              networkRule: networkRule,
              secEvent: secEvent
            },
            hasBackdrop: false,
            disableClose: true
          });
        },
        error => {}
      );

  };

  private prepareAutoCompleteData = (cachedSecurityEvents) => {
    this.autoComplete = {
      domain: this.domainList,
      host: this.getAutoCompleteData(e => e.hostName, cachedSecurityEvents),
      source: this.getAutoCompleteData(e => e.endpoint.source.displayName, cachedSecurityEvents),
      destination: this.getAutoCompleteData(e => e.endpoint.destination.displayName, cachedSecurityEvents),
    };
  }

  private getAutoCompleteData = (cb: (e: any) => any, secEvents: Array<any>): string[] => {
    return Array.from(new Set(secEvents.map(e => cb(e))))
      .filter(s => !!s)
      .sort();
  }

  private setAdvancedFilter = (filter?: any) => {
    if (filter) {
      this.advancedFilterModalService.advFilter = filter;
    }
    if (this.displayedSecurityEventsJsonBeforeApplyAdvFilter !== '[]') {
      this.securityEventsService.displayedSecurityEvents = JSON.parse(this.displayedSecurityEventsJsonBeforeApplyAdvFilter);
    }
    this.advFilter = this.advancedFilterModalService.advFilter;
    this.displayedSecurityEventsJsonBeforeApplyAdvFilter = JSON.stringify(this.securityEventsService.displayedSecurityEvents);
    this.securityEventsService.displayedSecurityEvents =
      this.securityEventsService.displayedSecurityEvents.filter(
        event => this.advancedFilterModalService.filterFn(event)
      )
    this.securityEventsService.prepareContext4TwoWayInfinityScroll();
  };

  private getSeverities = (severities: boolean[]) => {
    let _severities = [] as any;
    severities.forEach((severity, idx) => {
      if (severity) _severities.push(Object.values(FilterSeverity)[idx]);
    });
    return _severities;
  }

  private getLocations = (locations: boolean[]) => {
    let _locations = [] as any;
    locations.forEach((location, idx) => {
      if (location) _locations.push(Object.values(FilterLocation)[idx]);
    });
    return _locations;
  }

  private getCategories = (categories: boolean[]) => {
    let _categories = [] as any;
    categories.forEach((category, idx) => {
      if (category) _categories.push(Object.values(FilterCategory)[idx]);
    });
    return _categories;
  }

  private getOther = (other: boolean[]) => {
    let _other = [] as any;
    other.forEach((otherElem, idx) => {
      if (otherElem) _other.push(Object.values(Other)[idx]);
    });
    return _other;
  }

  private combineSecurityEvents = (securityEventsData) => {
    let startTime = new Date().getTime();
    this.threatList = JSON.parse(securityEventsData[0]);
    this.violationList = JSON.parse(securityEventsData[1]);
    this.incidentList = JSON.parse(securityEventsData[2]);
    let parseDataTime: number = new Date().getTime();
    console.log('Profile - Parse data: ', parseDataTime - startTime);

    console.log('Security Events (raw): ', [
      this.threatList,
      this.violationList,
      this.incidentList
    ]);

    let ipList = this.threatList.threats
      .flatMap((threat: any) => {
        let ips: Array<string> = [];
        if (
          threat.client_workload_id === MapConstant.securityEventLocation.EXTERNAL
        ) {
          ips.push(threat.client_ip);
        }
        if (
          threat.server_workload_id === MapConstant.securityEventLocation.EXTERNAL
        ) {
          ips.push(threat.server_ip);
        }
        return ips;
      })
      .concat(
        this.violationList.violations.flatMap((violation: any) => {
          let ips: Array<string> = [];
          if (violation.client_id === MapConstant.securityEventLocation.EXTERNAL) {
            ips.push(violation.client_ip);
          }
          if (violation.server_id === MapConstant.securityEventLocation.EXTERNAL) {
            ips.push(violation.server_ip);
          }
          return ips;
        })
      )
      .concat(
        this.incidentList.incidents.flatMap((incident: any) => {
          let ips: Array<string> = [];
          if (incident.workload_id === MapConstant.securityEventLocation.EXTERNAL) {
            ips.push(incident.client_ip);
          }
          if (
            incident.remote_workload_id ===
            MapConstant. securityEventLocation.EXTERNAL
          ) {
            ips.push(incident.server_ip);
          }
          return ips;
        })
      );
    console.log('IP list: ', ipList);

    let getIpListTime = new Date().getTime();
    console.log('Profile - Get ip list: ', getIpListTime - parseDataTime);

    this.securityEventsService.getIpGeoInfo(ipList)
      .subscribe(
        (response: any) => {

          let getIpGeoInfoTime = new Date().getTime();
          console.log('Profile - Get ip geo info: ', getIpGeoInfoTime - getIpListTime);

          let ipMap = response.ip_map;
          this.threatList = this.threatList.threats.map((threat: any) => {
            return this.securityEventsService.editDisplayedThreat(threat, ipMap);
          });
          this.violationList = this.violationList.violations.map((violation: any) => {
            return this.securityEventsService.editDisplayedViolation(
              violation,
              ipMap
            );
          });
          this.incidentList = this.incidentList.incidents.map((incident: any) => {
            return this.securityEventsService.editDisplayedIncident(
              incident,
              ipMap
            );
          });

          let editSecEventTime = new Date().getTime();
          console.log('Profile - Edit sec event time: ', editSecEventTime - getIpGeoInfoTime);

          this.securityEventsService.cachedSecurityEvents = this.securityEventsService.cachedSecurityEvents
            .concat(this.threatList)
            .concat(this.violationList)
            .concat(this.incidentList);

          let mergeSecEventTime = new Date().getTime();
          console.log('Profile - Merge sec event time: ', mergeSecEventTime - editSecEventTime);

          if (this.securityEventsService.cachedSecurityEvents.length > 0) {
            let sortingStartTime = new Date().getTime();
            this.securityEventsService.cachedSecurityEvents = this.securityEventsService.cachedSecurityEvents.sort(
              (a, b) => {
                return b.reportedTimestamp - a.reportedTimestamp;
              }
            );

            let sortSecEventTime = new Date().getTime();
            console.log('Profile - Sort sec event time: ', sortSecEventTime - mergeSecEventTime);

            console.log(
              'Security Events (After edited): ',
              JSON.parse(JSON.stringify(this.securityEventsService.cachedSecurityEvents))
            );


            this.domainList = this._getDomainList(this.securityEventsService.cachedSecurityEvents);
            this.prepareAutoCompleteData(this.securityEventsService.cachedSecurityEvents);

            if (this.selectedRow !== 'null') {
              this.onQuickFilterChange(this.datePipe.transform(this.selectedRow.reported_at, 'MMM dd, yyyy HH:mm:ss')!);
            } else {
              this.securityEventsService.displayedSecurityEvents = JSON.parse(JSON.stringify(this.securityEventsService.cachedSecurityEvents));
            }
            this.securityEventsService.prepareContext4TwoWayInfinityScroll();
          }
          this.isDataReady = true;
        },
        error => {}
      );
  };

  private _getDomainList = (allSecurityEvents) => {
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
  }
}
