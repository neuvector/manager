import { Component, OnInit } from '@angular/core';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';

@Component({
  selector: 'app-application-protocols-panel',
  templateUrl: './application-protocols-panel.component.html',
  styleUrls: ['./application-protocols-panel.component.scss']
})
export class ApplicationProtocolsPanelComponent implements OnInit {

  constructor(
    public dashboardDetailsService: DashboardDetailsService
  ) { }

  ngOnInit(): void {
  }

}
