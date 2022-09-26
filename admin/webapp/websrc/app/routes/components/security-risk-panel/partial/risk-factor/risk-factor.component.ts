import { Component, OnInit, Input } from '@angular/core';
import { RiskFactor } from '@common/types';

@Component({
  selector: 'app-risk-factor',
  templateUrl: './risk-factor.component.html',
  styleUrls: ['./risk-factor.component.scss']
})
export class RiskFactorComponent implements OnInit {

  @Input() riskFactor: RiskFactor;
  subScore: any;

  constructor() { }

  ngOnInit(): void {
  }

}
