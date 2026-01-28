import { Component, OnInit, Input } from '@angular/core';
import { NetworkRule } from '@common/types/network-rules/network-rules';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-network-rules-printable-report',
  templateUrl: './network-rules-printable-report.component.html',
  styleUrls: ['./network-rules-printable-report.component.scss'],
})
export class NetworkRulesPrintableReportComponent implements OnInit {
  @Input() networkRules: Array<NetworkRule>;
  colourMap = MapConstant.colourMap;
  statisticData: Map<string, number>;
  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    let fed = this.translate.instant(
      `policy.head.${MapConstant.colourMap[GlobalConstant.CFG_TYPE.FED]
        .replace('-', '_')
        .toUpperCase()}`
    );
    let crd = this.translate.instant(
      `policy.head.${MapConstant.colourMap[GlobalConstant.CFG_TYPE.GROUND]
        .replace('-', '_')
        .toUpperCase()}`
    );
    let customer = this.translate.instant(
      `policy.head.${MapConstant.colourMap[GlobalConstant.CFG_TYPE.CUSTOMER]
        .replace('-', '_')
        .toUpperCase()}`
    );
    let learned = this.translate.instant(
      `policy.head.${MapConstant.colourMap[GlobalConstant.CFG_TYPE.LEARNED]
        .replace('-', '_')
        .toUpperCase()}`
    );
    this.statisticData = new Map([
      [fed, 0],
      [crd, 0],
      [customer, 0],
      [learned, 0],
    ]);
    this.networkRules.forEach(rule => {
      if (rule.id > -1) {
        if (!this.statisticData.has(this.getCfgTypeText(rule.cfg_type))) {
          this.statisticData.set(this.getCfgTypeText(rule.cfg_type), 1);
        } else {
          this.statisticData.set(
            this.getCfgTypeText(rule.cfg_type),
            this.statisticData.get(this.getCfgTypeText(rule.cfg_type))! + 1
          );
        }
      }
    });
    console.log(this.statisticData);
  }

  private getCfgTypeText = cfg_type => {
    return this.translate.instant(
      `policy.head.${MapConstant.colourMap[cfg_type]
        .replace('-', '_')
        .toUpperCase()}`
    );
  };
}
