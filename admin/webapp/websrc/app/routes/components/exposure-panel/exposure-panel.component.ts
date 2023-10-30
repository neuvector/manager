import { Component, OnInit, Input } from '@angular/core';
import { InternalSystemInfo, HierarchicalExposure } from '@common/types';
import { parseExposureHierarchicalData } from '@common/utils/common.utils';
import { DashboardExposureConversationsService } from '@routes/dashboard/thread-services/dashboard-exposure-conversations.service';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-exposure-panel',
  templateUrl: './exposure-panel.component.html',
  styleUrls: ['./exposure-panel.component.scss'],
})
export class ExposurePanelComponent implements OnInit {
  @Input() scoreInfo!: InternalSystemInfo;
  hierarchicalIngressList!: Array<HierarchicalExposure>;
  hierarchicalEgressList!: Array<HierarchicalExposure>;
  instructions: Array<string> = [];
  Array = Array;

  constructor(
    public dashboardExposureConversationsService: DashboardExposureConversationsService,
    private utilsService: UtilsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.exposure.txt1'),
      this.translate.instant('dashboard.help.exposure.txt2')
    ];
    this.hierarchicalIngressList = parseExposureHierarchicalData(
      this.scoreInfo.ingress
    );
    this.hierarchicalEgressList = parseExposureHierarchicalData(
      this.scoreInfo.egress
    );
  }

  downloadExposureConversationCsv = () => {
    let exposureList: any = [];
    this.dashboardExposureConversationsService.exposureConversationList.forEach(exposure => {
      exposure.entries.map((entry, index) => {
        let _entry = {};
        if (index === 0) {
          _entry = Object.assign({
            Direction: exposure.type,
            Host: exposure.type === "ingress" ? exposure.to.host_name : exposure.from.host_name,
            Namespace: exposure.type === "ingress" ? exposure.to.domain : exposure.from.domain,
            Image: exposure.type === "ingress" ? exposure.to.image : exposure.from.image,
            Service: exposure.type === "ingress" ? exposure.to.service : exposure.from.service,
            Pod: exposure.type === "ingress" ? exposure.to.display_name : exposure.from.display_name,
            Applications: exposure.applications.concat(exposure.ports).join(";"),
            'Policy Mode': exposure.type === "ingress" ? exposure.to.policy_mode : exposure.from.policy_mode,
            Action: exposure.policy_action,
            'External Count': exposure.entries.length
          }, _entry);
        } else {
          _entry = Object.assign({
            direction: "",
            host: "",
            namespace: "",
            image: "",
            service: "",
            pod: "",
            applications: "",
            'policy mode': "",
            action: "",
            'External Count': ""
          }, _entry);
        }
        _entry = Object.assign(_entry, {
          'External Host Name': entry.fqdn,
          'External IP': exposure.type === "ingress" ? entry.client_ip : entry.server_ip,
          'External Application': entry.application,
          'External Port': entry.port,
          'External Data Bytes': entry.bytes,
          'Exteranl Sessions': entry.sessions,
          'Exteranl Action': entry.policy_action
        });

        exposureList.push(_entry);
      });
    });

    let csv = arrayToCsv(exposureList);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    let filename = `exposure_report_${this.utilsService.parseDatetimeStr(new Date())}.csv`;

    saveAs(blob, filename);
  };
}
