import { Component, OnInit, Input } from '@angular/core';
import { DashboardSecurityEventsService } from '@routes/dashboard/thread-services/dashboard-security-events.service';

@Component({
  selector: 'app-top-security-events-panel',
  templateUrl: './top-security-events-panel.component.html',
  styleUrls: ['./top-security-events-panel.component.scss']
})
export class TopSecurityEventsPanelComponent implements OnInit {

  @Input() direction: string;

  constructor(
    public dashboardSecurityEventsService: DashboardSecurityEventsService
  ) { }

  ngOnInit(): void {
  }

}
