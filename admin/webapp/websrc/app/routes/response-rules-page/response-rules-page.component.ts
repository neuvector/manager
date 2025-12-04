import { Component, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-response-rules-page',
  templateUrl: './response-rules-page.component.html',
  styleUrls: ['./response-rules-page.component.scss'],
})
export class ResponseRulesPageComponent implements OnInit {
  public navSource: string;

  constructor() {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.SELF;
  }
}
