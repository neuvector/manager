import { Component, OnInit, Input } from '@angular/core';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';
import { InternalSystemInfo } from '@common/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-policy-mode-panel',
  templateUrl: './policy-mode-panel.component.html',
  styleUrls: ['./policy-mode-panel.component.scss']
})
export class PolicyModePanelComponent implements OnInit {

  instructions: Array<string>;

  @Input() assetType: string;
  @Input() scoreInfo: InternalSystemInfo;

  constructor(
    public dashboardDetailsService: DashboardDetailsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.policy_mode_pod.txt1'),
      this.translate.instant('dashboard.help.policy_mode_pod.txt2')
    ];
  }

}
