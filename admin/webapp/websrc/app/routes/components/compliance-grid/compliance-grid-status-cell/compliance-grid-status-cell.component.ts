import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  standalone: false,
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

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.labelCode = MapConstant.colourMap[this.params.data.level];
    this.status = this.utils.getI18Name(this.params.data.level);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
