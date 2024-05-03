import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-registry-details-table-status-cell',
  templateUrl: './registry-details-table-status-cell.component.html',
  styleUrls: ['./registry-details-table-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsTableStatusCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  status!: string;
  labelCode!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.status = params && params.node.data ? params.node.data.status : '';
    this.labelCode = MapConstant.colourMap[this.status];
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
