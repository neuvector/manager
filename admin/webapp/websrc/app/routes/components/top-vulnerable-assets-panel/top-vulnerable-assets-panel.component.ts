import { Component, OnInit, Input } from '@angular/core';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-top-vulnerable-assets-panel',
  templateUrl: './top-vulnerable-assets-panel.component.html',
  styleUrls: ['./top-vulnerable-assets-panel.component.scss']
})
export class TopVulnerableAssetsPanelComponent implements OnInit {

  instructions: Array<string>;

  @Input() assetType: string;
  @Input() isScanOff: boolean = false;

  constructor(
    public dashboardDetailsService: DashboardDetailsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.instructions = this.assetType === 'containers' ? [
      this.translate.instant('dashboard.help.top_incident_pod.txt1'),
      this.translate.instant('dashboard.help.top_incident_pod.txt2')
    ] : [
      this.translate.instant('dashboard.help.top_incident_node.txt1'),
      this.translate.instant('dashboard.help.top_incident_node.txt2')
    ];
  }

}
