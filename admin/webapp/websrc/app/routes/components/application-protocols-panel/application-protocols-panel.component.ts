import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-application-protocols-panel',
  templateUrl: './application-protocols-panel.component.html',
  styleUrls: ['./application-protocols-panel.component.scss'],
})
export class ApplicationProtocolsPanelComponent implements OnInit {
  @Input() details: any;

  instructions: Array<string>;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.instructions = [
      this.translate.instant('dashboard.help.application.txt1'),
      this.translate.instant('dashboard.help.application.txt2'),
      this.translate.instant('dashboard.help.application.txt3'),
      this.translate.instant('dashboard.help.application.txt4'),
    ];
  }
}
