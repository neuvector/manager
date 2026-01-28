import { Component, OnInit } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-process-profile-rule-name-header',
  templateUrl: './process-profile-rule-name-header.component.html',
  styleUrls: ['./process-profile-rule-name-header.component.scss'],
})
export class ProcessProfileRuleNameHeaderComponent implements IHeaderAngularComp {
  isZeroDrift: boolean = false;

  constructor() {}

  agInit(headerParams: IHeaderParams): void {
    this.isZeroDrift =
      headerParams.context.componentParent.baselineProfile === 'zero-drift';
  }

  refresh(params: IHeaderParams): boolean {
    return false;
  }
}
