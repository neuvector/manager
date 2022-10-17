import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-security-events-printable-report-location-col',
  templateUrl: './security-events-printable-report-location-col.component.html',
  styleUrls: ['./security-events-printable-report-location-col.component.scss']
})
export class SecurityEventsPrintableReportLocationColComponent implements OnInit {

  locationList: string[];

  @Input() location: string;

  constructor() { }

  ngOnInit(): void {
    this.locationList = this.location.split('<br/>');
  }

}
