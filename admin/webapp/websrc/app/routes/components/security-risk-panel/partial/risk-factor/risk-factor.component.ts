import { Component, Input } from '@angular/core';
import { RiskFactor } from '@common/types';


@Component({
  standalone: false,
  selector: 'app-risk-factor',
  templateUrl: './risk-factor.component.html',
  styleUrls: ['./risk-factor.component.scss'],
  
})
export class RiskFactorComponent {
  @Input() riskFactor: RiskFactor;
  subScore: any;

  constructor() {}
}
