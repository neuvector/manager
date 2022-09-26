import { Component, OnInit } from '@angular/core';
import { DashboardSecurityEventsService } from '@routes/dashboard/thread-services/dashboard-security-events.service';

@Component({
  selector: 'app-security-events-panel',
  templateUrl: './security-events-panel.component.html',
  styleUrls: ['./security-events-panel.component.scss']
})
export class SecurityEventsPanelComponent implements OnInit {

  constructor(
    public dashboardSecurityEventsService: DashboardSecurityEventsService
  ) { }

  ngOnInit(): void {}

}
