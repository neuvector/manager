import { Component, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-dlp-sensors-page',
  templateUrl: './dlp-sensors-page.component.html',
  styleUrls: ['./dlp-sensors-page.component.scss'],
})
export class DlpSensorsPageComponent implements OnInit {
  public navSource: string;
  constructor() {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.SELF;
  }
}
