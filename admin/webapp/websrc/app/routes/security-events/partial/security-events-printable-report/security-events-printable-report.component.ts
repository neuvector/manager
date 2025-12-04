import { Component, OnInit, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-security-events-printable-report',
  templateUrl: './security-events-printable-report.component.html',
  styleUrls: ['./security-events-printable-report.component.scss'],
})
export class SecurityEventsPrintableReportComponent implements OnInit {
  @Input() securityEvents: any[];

  severityMap: Map<string, number>;
  severityEntries: any;

  constructor() {}

  ngOnInit(): void {
    this.severityMap = new Map();
    this.securityEvents = this.securityEvents.map(secEvent => {
      secEvent.Details.replace(/\\n/g, '<br/>');
      this.severityMap.set(
        secEvent.Severity,
        (this.severityMap.get(secEvent.Severity) || 0) + 1
      );
      return secEvent;
    });

    this.severityEntries = Array.from(this.severityMap.entries());
    console.log('this.severityEntries', this.severityEntries);
  }
}
