import { Component, OnInit } from '@angular/core';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-application-protocols-panel',
  templateUrl: './application-protocols-panel.component.html',
  styleUrls: ['./application-protocols-panel.component.scss']
})
export class ApplicationProtocolsPanelComponent implements OnInit {

  instructions: Array<string>;

  constructor(
    public dashboardDetailsService: DashboardDetailsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.application.txt1'),
      this.translate.instant('dashboard.help.application.txt2'),
      this.translate.instant('dashboard.help.application.txt3'),
      this.translate.instant('dashboard.help.application.txt4')
    ];
  }

}
