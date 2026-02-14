import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-domain-name-cell',
  templateUrl: './domain-name-cell.component.html',
  styleUrls: ['./domain-name-cell.component.scss'],
})
export class DomainNameCellComponent implements ICellRendererAngularComp {
  displayName!: string;
  params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.displayName = GlobalConstant.Namespace_Boundary_Enabled;
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
