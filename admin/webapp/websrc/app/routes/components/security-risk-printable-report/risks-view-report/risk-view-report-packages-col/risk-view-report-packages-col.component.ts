import { Component, OnInit, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-risk-view-report-packages-col',
  templateUrl: './risk-view-report-packages-col.component.html',
  styleUrls: ['./risk-view-report-packages-col.component.scss'],
})
export class RiskViewReportPackagesColComponent implements OnInit {
  displayedPackages: any[];

  @Input() packages: any;
  @Input() isInAppendix: boolean;

  constructor() {}

  ngOnInit(): void {
    this.displayedPackages = Object.entries(this.packages);
  }
}
