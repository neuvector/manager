import { Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-risk-report-grid-level-cell',
  templateUrl: './risk-report-grid-level-cell.component.html',
  styleUrls: ['./risk-report-grid-level-cell.component.scss'],
})
export class RiskReportGridLevelCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  levelText!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.labelCode = MapConstant.colourMap[params.data.level];
    this.levelText = this.utils.getI18Name(params.data.level);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
