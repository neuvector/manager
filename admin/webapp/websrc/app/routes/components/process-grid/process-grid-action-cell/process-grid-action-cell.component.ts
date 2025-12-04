import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-process-grid-action-cell',
  templateUrl: './process-grid-action-cell.component.html',
  styleUrls: ['./process-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessGridActionCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  action!: string;
  mode!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.action = this.params.data.action;
    this.mode = this.utils.getI18Name(this.action);
    this.labelCode = MapConstant.colourMap[this.action] || 'info';
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
