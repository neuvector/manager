import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-security-events-printable-report-severity-col',
  templateUrl: './security-events-printable-report-severity-col.component.html',
  styleUrls: ['./security-events-printable-report-severity-col.component.scss'],
})
export class SecurityEventsPrintableReportSeverityColComponent implements OnInit {
  @Input() severity: string;

  colourMap: any;

  constructor() {}

  ngOnInit(): void {
    this.colourMap = MapConstant.colourMap;
  }
}
