import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-test-connection-dialog-type-cell',
  templateUrl: './test-connection-dialog-type-cell.component.html',
  styleUrls: ['./test-connection-dialog-type-cell.component.scss'],
})
export class TestConnectionDialogTypeCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  type!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.type = params.node.data.step_type;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
