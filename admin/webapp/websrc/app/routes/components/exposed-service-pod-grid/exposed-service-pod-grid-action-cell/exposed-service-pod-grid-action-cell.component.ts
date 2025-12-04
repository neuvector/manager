import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-exposed-service-pod-grid-action-cell',
  templateUrl: './exposed-service-pod-grid-action-cell.component.html',
  styleUrls: ['./exposed-service-pod-grid-action-cell.component.scss'],
  
})
export class ExposedServicePodGridActionCellComponent
  implements ICellRendererAngularComp
{
  params: any;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
