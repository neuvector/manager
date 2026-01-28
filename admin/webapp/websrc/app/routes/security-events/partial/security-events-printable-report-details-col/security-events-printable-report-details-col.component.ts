import { Component, OnInit, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-security-events-printable-report-details-col',
  templateUrl: './security-events-printable-report-details-col.component.html',
  styleUrls: ['./security-events-printable-report-details-col.component.scss'],
})
export class SecurityEventsPrintableReportDetailsColComponent implements OnInit {
  detailList: string[];

  @Input() details: string;

  constructor() {}

  ngOnInit(): void {
    this.detailList = this.details.split('<br/>');
  }
}
