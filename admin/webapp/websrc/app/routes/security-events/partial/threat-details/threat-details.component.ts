import { Component, Input } from '@angular/core';
import { SecurityEventsService } from '@services/security-events.service';

@Component({
  standalone: false,
  selector: 'app-threat-details',
  templateUrl: './threat-details.component.html',
  styleUrls: ['./threat-details.component.scss'],
})
export class ThreatDetailsComponent {
  @Input() secEvent: any;

  constructor(private securityEventsService: SecurityEventsService) {}

  showEnforcerDetails = (ev, enforcerId: string, enforcerName: string) => {
    this.securityEventsService.showEnforcerDetails(
      ev,
      enforcerId,
      enforcerName
    );
  };
}
