import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { param } from 'jquery';


@Component({
  standalone: false,
  selector: 'app-registry-table-status-cell',
  templateUrl: './registry-table-status-cell.component.html',
  styleUrls: ['./registry-table-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class RegistryTableStatusCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  onMenuClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
