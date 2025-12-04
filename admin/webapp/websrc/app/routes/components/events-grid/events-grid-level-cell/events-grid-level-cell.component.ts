import { Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-events-grid-level-cell',
  templateUrl: './events-grid-level-cell.component.html',
  styleUrls: ['./events-grid-level-cell.component.scss'],
})
export class EventsGridLevelCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  level!: string;
  levelText!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.level = params.data.level;
    this.labelCode = MapConstant.colourMap[this.level];
    this.levelText = this.utils.getI18Name(this.level);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
