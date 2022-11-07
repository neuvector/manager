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
  instructions: Array<string>;

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
      let entryList = exposure.entries.map((entry, index) => {
        let _entry = {};
        if (index === 0) {
          _entry = Object.assign({
            direction: exposure.type,
            node: exposure.type === "ingress" ? exposure.to.host_name : exposure.from.host_name,
            namespace: exposure.type === "ingress" ? exposure.to.domain : exposure.from.domain,
            image: exposure.type === "ingress" ? exposure.to.image : exposure.from.image,
            service: exposure.type === "ingress" ? exposure.to.service : exposure.from.service,
            pod: exposure.type === "ingress" ? exposure.to.display_name : exposure.from.display_name,
            applications: exposure.applications.concat(exposure.ports).join(";"),
            policy_mode: exposure.type === "ingress" ? exposure.to.policy_mode : exposure.from.policy_mode,
            action: exposure.policy_action,
            entry_count: exposure.entries.length
          }, _entry);
        } else {
          _entry = Object.assign({
            direction: "",
            node: "",
            namespace: "",
            image: "",
            service: "",
            pod: "",
            applications: "",
            policy_mode: "",
            action: "",
            entry_count: ""
          }, _entry);
        }
        _entry = Object.assign(_entry, {
          entry_ip: exposure.type === "ingress" ? entry.client_ip : entry.server_ip,
          entry_application: entry.application,
          entry_port: entry.port,
          entry_bytes: entry.bytes,
          entry_sessions: entry.sessions,
          entry_action: entry.policy_action
        });
        exposureList.push(_entry);
      });
    });
    console.log("exposureList: ",exposureList);

    let csv = arrayToCsv(exposureList);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    let filename = `exposure_report_${this.utilsService.parseDatetimeStr(new Date())}.csv`;

    saveAs(blob, filename);
  };
}
