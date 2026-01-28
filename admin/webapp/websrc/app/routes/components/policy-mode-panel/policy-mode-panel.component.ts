import { Component, OnInit, Input } from '@angular/core';
import { InternalSystemInfo } from '@common/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-policy-mode-panel',
  templateUrl: './policy-mode-panel.component.html',
  styleUrls: ['./policy-mode-panel.component.scss'],
})
export class PolicyModePanelComponent implements OnInit {
  @Input() details: any;
  @Input() assetType: string;
  @Input() scoreInfo: InternalSystemInfo;

  instructions: Array<string>;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.policy_mode_pod.txt1'),
      this.translate.instant('dashboard.help.policy_mode_pod.txt2'),
    ];
  }
}
