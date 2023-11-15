import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatchedRule } from '@common/types';
import { MapConstant } from '@common/constants/map.constant';
import { AdmissionRulesService } from "@services/admission-rules.service";

@Component({
  selector: 'app-matched-rule-list',
  templateUrl: './matched-rule-list.component.html',
  styleUrls: ['./matched-rule-list.component.scss']
})
export class MatchedRuleListComponent implements ICellRendererAngularComp {

  params: ICellRendererParams;
  matchedRules: Array<MatchedRule>;
  colourMap: any = MapConstant.colourMap;

  constructor(
    private admissionRulesService: AdmissionRulesService
  ) {

  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.matchedRules = params.data.matched_rules.map(rule => {
      if (!rule.mode) rule.mode = this.admissionRulesService.globalMode;
      return rule;
    });
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }


}
