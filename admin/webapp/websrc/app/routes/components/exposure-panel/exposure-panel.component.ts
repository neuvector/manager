import { Component, OnInit, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  InternalSystemInfo,
  HierarchicalExposure,
  Exposure,
} from '@common/types';
import { parseExposureHierarchicalData } from '@common/utils/common.utils';
import { DashboardExposureConversationsService } from '@routes/dashboard/thread-services/dashboard-exposure-conversations.service';
import { DashboardService } from '@common/services/dashboard.service';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { uuid } from '@common/utils/common.utils';


@Component({
  standalone: false,
  selector: 'app-exposure-panel',
  templateUrl: './exposure-panel.component.html',
  styleUrls: ['./exposure-panel.component.scss'],
  
})
export class ExposurePanelComponent implements OnInit {
  @Input() scoreInfo!: InternalSystemInfo;

  hierarchicalIngressList!: Array<HierarchicalExposure>;
  hierarchicalEgressList!: Array<HierarchicalExposure>;
  instructions: Array<string> = [];
  isIpMapReady: boolean = false;

  constructor(
    public dashboardExposureConversationsService: DashboardExposureConversationsService,
    private dashboardService: DashboardService,
    private utilsService: UtilsService,
    private datePipe: DatePipe,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.exposure.txt1'),
      this.translate.instant('dashboard.help.exposure.txt2'),
    ];
    this.hierarchicalIngressList =
      parseExposureHierarchicalData(this.scoreInfo.ingress) || [];
    this.hierarchicalEgressList =
      parseExposureHierarchicalData(this.scoreInfo.egress) || [];
    this.retrieveIpLocation(this.scoreInfo);
  }

  retrieveIpLocation = scoreInfo => {
    let ipList = this.getIpList(scoreInfo);
    this.isIpMapReady = false;
    this.dashboardService.getIpGeoInfo(ipList).subscribe((response: any) => {
      let ipMap = response.ip_map;
      this.hierarchicalIngressList =
        parseExposureHierarchicalData(
          this.addIpLocation(this.scoreInfo.ingress, ipMap, 'ingress')
        ) || [];
      this.hierarchicalEgressList =
        parseExposureHierarchicalData(
          this.addIpLocation(this.scoreInfo.egress, ipMap, 'egress')
        ) || [];
      this.dashboardService.hierarchicalIngressList = JSON.parse(
        JSON.stringify(this.hierarchicalIngressList)
      );
      this.dashboardService.hierarchicalEgressList = JSON.parse(
        JSON.stringify(this.hierarchicalEgressList)
      );
      this.isIpMapReady = true;
    });
  };

  downloadExposureConversationCsv = () => {
    let ingressReport = this.getExposureReportData(
      this.scoreInfo.ingress,
      'ingress'
    );
    let egressReport = this.getExposureReportData(
      this.scoreInfo.egress,
      'egress'
    );

    let exposureReport = ingressReport.concat(egressReport);

    let csv = arrayToCsv(exposureReport);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    let filename = `exposure_report_${this.utilsService.parseDatetimeStr(
      new Date()
    )}.csv`;

    saveAs(blob, filename);
  };

  private getIpList = scoreInfo => {
    return scoreInfo.ingress
      .flatMap(ingress => {
        return ingress.entries
          ? ingress.entries.map(entry => entry.client_ip)
          : [];
      })
      .concat(
        scoreInfo.egress.flatMap(egress => {
          return egress.entries
            ? egress.entries.map(entry => entry.server_ip)
            : [];
        })
      );
  };

  private addIpLocation = (
    exposureList: Array<Exposure>,
    ipMap: any,
    direction: string
  ) => {
    return exposureList
      .sort((a, b) =>
        (a.service + a.pod_name).localeCompare(b.service + b.pod_name)
      )
      .map((exposure: Exposure) => {
        exposure.entries =
          exposure.entries?.map(entry => {
            entry.id = uuid();
            entry.ip =
              direction === 'ingress' ? entry.client_ip : entry.server_ip;
            entry.country_code =
              ipMap[entry.ip || ''].country_code.toLowerCase();
            entry.country_name = ipMap[entry.ip || ''].country_name;
            return entry;
          }) || [];
        return exposure;
      });
  };

  private getExposureReportData = (
    exposureList: Array<Exposure>,
    direction: string
  ) => {
    let exposureReport: any = [];
    exposureList.forEach((exposure: Exposure) => {
      exposure.entries?.forEach(entry => {
        exposureReport.push({
          Direction: direction,
          Service: exposure.service,
          Pod: exposure.display_name,
          'High Vuls': exposure.high,
          'Medium Vuls': exposure.medium,
          'Policy Mode': exposure.policy_mode,
          'External Location':
            entry.country_name !== '-' ? entry.country_name : '',
          'External IP': entry.ip,
          'External Host': entry.fqdn,
          Port: entry.port,
          Bytes: entry.bytes,
          Applications: entry.application,
          Sessions: entry.sessions,
          Action: entry.policy_action,
          'Session Time': this.datePipe.transform(
            entry.last_seen_at * 1000,
            'MMM dd, y HH:mm:ss'
          ),
        });
      });
    });
    return exposureReport;
  };
}
