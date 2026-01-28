import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-top-security-events-panel',
  templateUrl: './top-security-events-panel.component.html',
  styleUrls: ['./top-security-events-panel.component.scss'],
})
export class TopSecurityEventsPanelComponent implements OnInit {
  @Input() securityEvents: any;
  @Input() direction: string;

  instructions: Array<string>;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.instructions =
      this.direction === 'source'
        ? [
            this.translate.instant('dashboard.help.top_security_events.txt1'),
            this.translate.instant('dashboard.help.top_security_events.txt2'),
            this.translate.instant('dashboard.help.top_security_events.txt2_1'),
            this.translate.instant('dashboard.help.top_security_events.txt2_2'),
            this.translate.instant('dashboard.help.top_security_events.txt2_3'),
          ]
        : [
            this.translate.instant('dashboard.help.top_security_events.txt3'),
            this.translate.instant('dashboard.help.top_security_events.txt4'),
            this.translate.instant('dashboard.help.top_security_events.txt4_1'),
            this.translate.instant('dashboard.help.top_security_events.txt4_2'),
            this.translate.instant('dashboard.help.top_security_events.txt4_3'),
          ];
  }
}
