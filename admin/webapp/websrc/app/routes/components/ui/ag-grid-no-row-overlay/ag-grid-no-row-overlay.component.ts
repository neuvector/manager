import { Component, OnInit, Input } from '@angular/core';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { TranslateService } from '@ngx-translate/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-ag-grid-no-row-overlay',
  templateUrl: './ag-grid-no-row-overlay.component.html',
  styleUrls: ['./ag-grid-no-row-overlay.component.scss'],
})
export class AgGridNoRowOverlayComponent implements INoRowsOverlayAngularComp {
  noRowsClass: string = '';
  noRowsMsg: string = this.translate.instant('general.NO_ROWS');
  iconName: string;
  iconColor: string;

  constructor(private translate: TranslateService) {}

  agInit(params: ICellRendererParams): void {
    this.noRowsMsg = params.context.noRowsMsg;
    this.noRowsClass = params.context.noRowsClass;
    this.iconName = params.context.iconName;
    this.iconColor = params.context.iconColor;
  }
}
