import { Component, OnInit, Input } from '@angular/core';
import { SecurityEventsService } from '@services/security-events.service';

@Component({
  selector: 'app-violation-details',
  templateUrl: './violation-details.component.html',
  styleUrls: ['./violation-details.component.scss']
})
export class ViolationDetailsComponent implements OnInit {

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
