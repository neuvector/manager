import { Component, OnInit, Input } from '@angular/core';
import { DashboardDetailsService } from '@routes/dashboard/thread-services/dashboard-details.service';
import { InternalSystemInfo } from '@common/types';

@Component({
  selector: 'app-policy-mode-panel',
  templateUrl: './policy-mode-panel.component.html',
  styleUrls: ['./policy-mode-panel.component.scss']
})
export class PolicyModePanelComponent implements OnInit {

  @Input() assetType: string;
  @Input() scoreInfo: InternalSystemInfo;

  constructor(
    public dashboardDetailsService: DashboardDetailsService
  ) { }

  ngOnInit(): void {
  }

}
