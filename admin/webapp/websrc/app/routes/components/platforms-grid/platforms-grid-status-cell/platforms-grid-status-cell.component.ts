import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-platforms-grid-status-cell',
  templateUrl: './platforms-grid-status-cell.component.html',
  styleUrls: ['./platforms-grid-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformsGridStatusCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  status!: string;
  labelCode!: string;
  displayStatus!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.status = this.params.data.status;
    this.labelCode = MapConstant.colourMap[this.status];
    this.displayStatus = this.utils.getI18Name(this.status);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
