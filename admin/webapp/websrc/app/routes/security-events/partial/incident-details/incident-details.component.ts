import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SecurityEventsService } from '@services/security-events.service';


@Component({
  standalone: false,
  selector: 'app-incident-details',
  templateUrl: './incident-details.component.html',
  styleUrls: ['./incident-details.component.scss'],
  
})
export class IncidentDetailsComponent {
  @Input() secEvent: any;

  constructor(
    private router: Router,
    private securityEventsService: SecurityEventsService
  ) {}

  goToGroupPage = (groupName: string) => {
    this.router.navigate(['group', { groupName: groupName, from: 'process' }]);
  };

  showEnforcerDetails = (ev, enforcerId: string, enforcerName: string) => {
    this.securityEventsService.showEnforcerDetails(
      ev,
      enforcerId,
      enforcerName
    );
  };
}
