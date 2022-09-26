import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SecurityEventsService } from '@services/security-events.service';

@Component({
  selector: 'app-incident-details',
  templateUrl: './incident-details.component.html',
  styleUrls: ['./incident-details.component.scss']
})
export class IncidentDetailsComponent implements OnInit {

  @Input() secEvent: any;

  constructor(
    private router: Router,
    private securityEventsService: SecurityEventsService
  ) { }

  ngOnInit(): void {
  }

  goToGroupPage = (groupName: string) => {
    this.router.navigate(['group', {groupName: groupName, from: 'process'}]);
  };

  showEnforcerDetails = (ev, enforcerId: string, enforcerName: string) => {
    this.securityEventsService.showEnforcerDetails(ev, enforcerId, enforcerName);
  };

}
