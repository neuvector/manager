import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-test-connection-dialog-details-cell',
  templateUrl: './test-connection-dialog-details-cell.component.html',
  styleUrls: ['./test-connection-dialog-details-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class TestConnectionDialogDetailsCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  concat = 200;
  viewMore = false;
  content!: string;
  contentArr!: string[];
  type!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.content = params.node.data.step_content;
    this.type = params.node.data.step_type;
    if (this.type === 'images') {
      this.contentArr = this.content.split('\n');
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
