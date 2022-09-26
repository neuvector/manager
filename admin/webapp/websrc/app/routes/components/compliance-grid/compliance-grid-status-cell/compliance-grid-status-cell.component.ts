import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-compliance-grid-status-cell',
  templateUrl: './compliance-grid-status-cell.component.html',
  styleUrls: ['./compliance-grid-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplianceGridStatusCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  status!: string;
  labelCode!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.status = this.params.data.level;
    this.labelCode = MapConstant.colourMap[this.status];
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
