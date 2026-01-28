import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-controllers-grid-status-cell',
  templateUrl: './controllers-grid-status-cell.component.html',
  styleUrls: ['./controllers-grid-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControllersGridStatusCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  status!: string;
  statusText!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.status = this.params.data.connection_state;
    this.labelCode = MapConstant.colourMap[this.status];
    this.statusText = this.utils.getI18Name(this.status);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
