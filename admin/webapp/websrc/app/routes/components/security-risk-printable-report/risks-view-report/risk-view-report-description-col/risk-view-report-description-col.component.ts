import { Component, OnInit, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-risk-view-report-description-col',
  templateUrl: './risk-view-report-description-col.component.html',
  styleUrls: ['./risk-view-report-description-col.component.scss'],
})
export class RiskViewReportDescriptionColComponent implements OnInit {
  displayedDescrition: string[];

  @Input() description: string;

  constructor() {}

  ngOnInit(): void {
    this.displayedDescrition = this.description
      ? this.description.split('\n')
      : ['N/A'];
  }
}
