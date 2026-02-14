import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-security-events-printable-report-action-col',
  templateUrl: './security-events-printable-report-action-col.component.html',
  styleUrls: ['./security-events-printable-report-action-col.component.scss'],
})
export class SecurityEventsPrintableReportActionColComponent implements OnInit {
  colourMap: any;

  @Input() action: string;

  constructor() {}

  ngOnInit(): void {
    this.colourMap = MapConstant.colourMap;
  }
}
