import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatchedRule } from '@common/types';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-matched-rule-list',
  templateUrl: './matched-rule-list.component.html',
  styleUrls: ['./matched-rule-list.component.scss'],
  
})
export class MatchedRuleListComponent implements ICellRendererAngularComp {
  params: ICellRendererParams;
  matchedRules: Array<MatchedRule>;
  colourMap: any = MapConstant.colourMap;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.matchedRules = this.params.data.matched_rules;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
