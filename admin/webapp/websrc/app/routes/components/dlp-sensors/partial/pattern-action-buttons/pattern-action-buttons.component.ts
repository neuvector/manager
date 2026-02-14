import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-dlp-pattern-action-buttons',
  templateUrl: './pattern-action-buttons.component.html',
  styleUrls: ['./pattern-action-buttons.component.scss'],
})
export class PatternActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  deletePattern = pattern => {
    this.params.context.componentParent.patterns.splice(
      this.params.rowIndex,
      1
    );
    this.params.context.componentParent.gridApi4EditPatterns!.setGridOption(
      'rowData',
      this.params.context.componentParent.patterns
    );
  };
}
