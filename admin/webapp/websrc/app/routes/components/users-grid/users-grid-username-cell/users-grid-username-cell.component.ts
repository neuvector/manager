import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-users-grid-username-cell',
  templateUrl: './users-grid-username-cell.component.html',
  styleUrls: ['./users-grid-username-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class UsersGridUsernameCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  username!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.username = this.params.data.username;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
