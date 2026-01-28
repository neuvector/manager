import { Component, Input } from '@angular/core';
import { SecurityEventsService } from '@services/security-events.service';

@Component({
  standalone: false,
  selector: 'app-violation-details',
  templateUrl: './violation-details.component.html',
  styleUrls: ['./violation-details.component.scss'],
})
export class ViolationDetailsComponent {
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
