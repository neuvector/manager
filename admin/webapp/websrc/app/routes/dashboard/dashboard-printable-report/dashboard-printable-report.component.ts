import { Component, OnInit, Input } from '@angular/core';
import { HierarchicalExposure } from '@common/types';
import { DashboardService } from '@common/services/dashboard.service';

@Component({
  standalone: false,
  selector: 'app-dashboard-printable-report',
  templateUrl: './dashboard-printable-report.component.html',
  styleUrls: ['./dashboard-printable-report.component.scss'],
})
export class DashboardPrintableReportComponent implements OnInit {
  @Input() details: any;
  @Input() domain: string;
  @Input() reportInfo: any;

  hierarchicalIngressList!: Array<HierarchicalExposure>;
  hierarchicalEgressList!: Array<HierarchicalExposure>;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.hierarchicalIngressList =
      this.dashboardService.hierarchicalIngressList;
    this.hierarchicalEgressList = this.dashboardService.hierarchicalEgressList;

    if (this.domain) {
      this.hierarchicalIngressList = this.filterExposure(
        this.hierarchicalIngressList,
        this.domain
      );
      this.hierarchicalEgressList = this.filterExposure(
        this.hierarchicalEgressList,
        this.domain
      );
    }
  }

  private filterExposure = (
    exposure: Array<HierarchicalExposure>,
    domain: string
  ) => {
    return exposure.filter(row => {
      let serviceNameSec = row.service.split('.');
      console.log('serviceNameSec', serviceNameSec, domain);
      return serviceNameSec[serviceNameSec.length - 1] === domain;
    });
  };
}
