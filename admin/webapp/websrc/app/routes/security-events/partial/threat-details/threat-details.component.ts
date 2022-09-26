import { Component, OnInit, Input } from '@angular/core';
import { SecurityEventsService } from '@services/security-events.service';

@Component({
  selector: 'app-threat-details',
  templateUrl: './threat-details.component.html',
  styleUrls: ['./threat-details.component.scss']
})
export class ThreatDetailsComponent implements OnInit {

  @Input() secEvent: any;

  constructor(
    private securityEventsService: SecurityEventsService
  ) { }

  ngOnInit(): void {
  }

  showEnforcerDetails = (ev, enforcerId: string, enforcerName: string) => {
    this.securityEventsService.showEnforcerDetails(ev, enforcerId, enforcerName);
  };
}
