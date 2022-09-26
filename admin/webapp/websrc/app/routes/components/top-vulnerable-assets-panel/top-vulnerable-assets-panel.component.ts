import { Component, OnInit, Input } from '@angular/core';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';

@Component({
  selector: 'app-top-vulnerable-assets-panel',
  templateUrl: './top-vulnerable-assets-panel.component.html',
  styleUrls: ['./top-vulnerable-assets-panel.component.scss']
})
export class TopVulnerableAssetsPanelComponent implements OnInit {

  @Input() assetType: string;

  constructor(
    public dashboardDetailsService: DashboardDetailsService
  ) { }

  ngOnInit(): void {
  }

}
