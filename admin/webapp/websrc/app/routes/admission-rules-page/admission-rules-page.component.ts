import { Component, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-admission-rules-page',
  templateUrl: './admission-rules-page.component.html',
  styleUrls: ['./admission-rules-page.component.scss'],
})
export class AdmissionRulesPageComponent implements OnInit {
  public navSource: string;

  constructor() {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.SELF;
  }
}
