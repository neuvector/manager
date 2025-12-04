import { Component, Input } from '@angular/core';
import { Compliance } from '@common/types';


@Component({
  standalone: false,
  selector: 'app-compliance-items',
  templateUrl: './compliance-items.component.html',
  styleUrls: ['./compliance-items.component.scss'],
  
})
export class ComplianceItemsComponent {
  @Input() compliances!: Compliance[];
  @Input() domains!: string[];
  @Input() complianceDist!: any;
  pieChartView = false;

  constructor() {}

  toggleChartView(status?: boolean) {
    this.pieChartView = status === false ? status : !this.pieChartView;
  }

  updateCountDistribution(filteredCis) {
    let complianceDist = {
      error: 0,
      high: 0,
      warning: 0,
      note: 0,
      pass: 0,
      info: 0,
      manual: 0,
      platform: 0,
      image: 0,
      node: 0,
      container: 0,
    };
    filteredCis.forEach(compliance => {
      if (compliance.level === 'WARN') complianceDist.warning += 1;
      if (compliance.level === 'INFO') complianceDist.info += 1;
      if (compliance.level === 'PASS') complianceDist.pass += 1;
      if (compliance.level === 'NOTE') complianceDist.note += 1;
      if (compliance.level === 'ERROR') complianceDist.error += 1;
      if (compliance.level === 'HIGH') complianceDist.high += 1;
      if (compliance.level === 'MANUAL') complianceDist.manual += 1;
      if (compliance.platforms.length) complianceDist.platform += 1;
      if (compliance.images.length) complianceDist.image += 1;
      if (compliance.nodes.length) complianceDist.node += 1;
      if (compliance.workloads.length) complianceDist.container += 1;
    });
    this.complianceDist = complianceDist;
  }
}
