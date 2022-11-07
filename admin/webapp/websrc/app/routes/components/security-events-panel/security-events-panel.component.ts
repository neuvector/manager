import { Component, OnInit } from '@angular/core';
import { DashboardSecurityEventsService } from '@routes/dashboard/thread-services/dashboard-security-events.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-security-events-panel',
  templateUrl: './security-events-panel.component.html',
  styleUrls: ['./security-events-panel.component.scss']
})
export class SecurityEventsPanelComponent implements OnInit {

  instructions: Array<string>;

  constructor(
    public dashboardSecurityEventsService: DashboardSecurityEventsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.criticalEvent.txt1'),
      this.translate.instant('dashboard.help.criticalEvent.txt2')
    ];
  }

}
