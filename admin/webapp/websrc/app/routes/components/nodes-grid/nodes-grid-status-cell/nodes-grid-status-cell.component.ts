import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-nodes-grid-status-cell',
  templateUrl: './nodes-grid-status-cell.component.html',
  styleUrls: ['./nodes-grid-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodesGridStatusCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  status!: string;
  result!: string;
  labelCode!: string;
  displayStatus!: string;
  tooltip!: boolean;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    const scan_summary = this.params.data.scan_summary;
    this.status = scan_summary ? scan_summary.status : '';
    this.labelCode = MapConstant.colourMap[this.status];
    this.displayStatus = this.utils.getI18Name(this.status);
    this.result = scan_summary ? scan_summary.result : '';
    this.tooltip = !!(this.result && this.result !== 'succeeded');
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
