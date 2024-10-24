import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-risk-view-report-appendix-packages',
  templateUrl: './risk-view-report-appendix-packages.component.html',
  styleUrls: ['./risk-view-report-appendix-packages.component.scss'],
})
export class RiskViewReportAppendixPackagesComponent {
  @Input() data: any;

  constructor() {}
}
