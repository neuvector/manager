import { Component, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-network-rules-page',
  templateUrl: './network-rules-page.component.html',
  styleUrls: ['./network-rules-page.component.scss'],
})
export class NetworkRulesPageComponent implements OnInit {
  public navSource: string;

  constructor() {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.SELF;
  }
}
