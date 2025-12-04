import { Component, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-waf-sensors-page',
  templateUrl: './waf-sensors-page.component.html',
  styleUrls: ['./waf-sensors-page.component.scss'],
})
export class WafSensorsPageComponent implements OnInit {
  public navSource: string;
  constructor() {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.SELF;
  }
}
