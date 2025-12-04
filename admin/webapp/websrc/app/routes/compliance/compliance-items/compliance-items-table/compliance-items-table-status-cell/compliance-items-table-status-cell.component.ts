import { Component } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-compliance-items-table-status-cell',
  templateUrl: './compliance-items-table-status-cell.component.html',
  styleUrls: ['./compliance-items-table-status-cell.component.scss'],
  
})
export class ComplianceItemsTableStatusCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  status!: string;
  statusText!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.status = this.params.data.level;
    this.labelCode = MapConstant.colourMap[this.status];
    this.statusText = this.utils.getI18Name(this.status);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
