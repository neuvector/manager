import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';


@Component({
  standalone: false,
  selector: 'app-id-cell',
  templateUrl: './id-cell.component.html',
  styleUrls: ['./id-cell.component.scss'],
  
})
export class IdCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  navSource = GlobalConstant.NAV_SOURCE;
  cfgType = GlobalConstant.CFG_TYPE;
  newIdSeed = GlobalConstant.NEW_ID_SEED;
  source: string;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.source = this.params.context.componentParent.source;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
