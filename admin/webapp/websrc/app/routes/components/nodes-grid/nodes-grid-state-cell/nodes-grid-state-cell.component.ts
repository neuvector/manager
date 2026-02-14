import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-nodes-grid-state-cell',
  templateUrl: './nodes-grid-state-cell.component.html',
  styleUrls: ['./nodes-grid-state-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodesGridStateCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  state!: string;
  displayState!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.state = this.params.data.state || 'unmanaged';
    this.displayState = this.utils.getI18Name(this.state);
    this.labelCode = MapConstant.colourMap[this.state] || 'inverse';
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
