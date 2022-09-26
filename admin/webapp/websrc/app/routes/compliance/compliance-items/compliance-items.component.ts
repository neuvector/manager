import { Component, Input, OnInit } from '@angular/core';
import { Compliance } from '@common/types';

@Component({
  selector: 'app-compliance-items',
  templateUrl: './compliance-items.component.html',
  styleUrls: ['./compliance-items.component.scss'],
})
export class ComplianceItemsComponent implements OnInit {
  @Input() compliances!: Compliance[];
  @Input() domains!: string[];
  @Input() complianceDist!: any;
  pieChartView = false;

  constructor() {}

  toggleChartView(status?: boolean) {
    this.pieChartView = status === false ? status : !this.pieChartView;
  }

  ngOnInit(): void {}
}
