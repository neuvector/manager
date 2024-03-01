import { Component, OnInit, Input } from '@angular/core';
import { InternalSystemInfo, HierarchicalExposure } from '@common/types';
import { parseExposureHierarchicalData } from '@common/utils/common.utils';
import { DashboardService } from '@common/services/dashboard.service';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';

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

  constructor(
    private dashboardService: DashboardService,
    public dashboardDetailsService: DashboardDetailsService
  ) { }

  ngOnInit(): void {
    this.hierarchicalIngressList = this.dashboardService.hierarchicalIngressList;
    this.hierarchicalEgressList = this.dashboardService.hierarchicalEgressList;

    if (this.domain) {
      this.hierarchicalIngressList = this.filterExposure(this.hierarchicalIngressList, this.domain);
      this.hierarchicalEgressList = this.filterExposure(this.hierarchicalEgressList, this.domain);
    }
  }

  private filterExposure = (exposure: Array<HierarchicalExposure>, domain: string) => {
    return exposure.filter(row => {
      let serviceNameSec = row.service.split('.');
      console.log("serviceNameSec", serviceNameSec, domain);
      return serviceNameSec[serviceNameSec.length - 1] === domain;
    });
  };

}
