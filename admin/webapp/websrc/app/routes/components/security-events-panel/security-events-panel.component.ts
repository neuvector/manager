import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-security-events-panel',
  templateUrl: './security-events-panel.component.html',
  styleUrls: ['./security-events-panel.component.scss'],
})
export class SecurityEventsPanelComponent implements OnInit {
  @Input() securityEvents: any;

  instructions: Array<string>;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.criticalEvent.txt1'),
      this.translate.instant('dashboard.help.criticalEvent.txt2'),
    ];
  }
}
