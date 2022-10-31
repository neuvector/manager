import { Component, OnInit, Input } from '@angular/core';
import { InternalSystemInfo, HierarchicalExposure } from '@common/types';
import { parseExposureHierarchicalData } from '@common/utils/common.utils';

@Component({
  selector: 'app-dashboard-printable-report',
  templateUrl: './dashboard-printable-report.component.html',
  styleUrls: ['./dashboard-printable-report.component.scss']
})
export class DashboardPrintableReportComponent implements OnInit {

  @Input() domain: string;
  @Input() reportInfo: any;
  hierarchicalIngressList!: Array<HierarchicalExposure>;
  hierarchicalEgressList!: Array<HierarchicalExposure>;

  constructor() { }

  ngOnInit(): void {
    if (this.domain) {
      this.reportInfo.scoreInfo.ingress = this.filterExposure(this.reportInfo.scoreInfo.ingress);
      this.reportInfo.scoreInfo.egress = this.filterExposure(this.reportInfo.scoreInfo.egress);
    }
    console.log("this.reportInfo.scoreInfo.egress", this.reportInfo.scoreInfo.egress);
    this.hierarchicalIngressList = parseExposureHierarchicalData(
      this.reportInfo.scoreInfo.ingress
    );
    this.hierarchicalEgressList = parseExposureHierarchicalData(
      this.reportInfo.scoreInfo.egress
    );
  }

  private filterExposure = (exposure: any[]) => {
    return exposure.filter(row => {
      let serviceNameSec = row.service.split('.');
      console.log("serviceNameSec", serviceNameSec, this.domain);
      return serviceNameSec[serviceNameSec.length - 1] === this.domain;
    });
  };

}
