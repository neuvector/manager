import { Component } from '@angular/core';
import { getDisplayName } from '@common/utils/common.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-events-grid-location-cell',
  templateUrl: './events-grid-location-cell.component.html',
  styleUrls: ['./events-grid-location-cell.component.scss'],
  
})
export class EventsGridLocationCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  get displayWorkload() {
    return this.params.data.workload_domain
      ? `${this.params.data.workload_domain}: ${getDisplayName(
          this.params.data.workload_name
        )}`
      : `${getDisplayName(this.params.data.workload_name)}`;
  }
  get displayImage() {
    return this.params.data.workload_domain
      ? `${this.params.data.workload_domain}: ${this.params.data.workload_image}`
      : this.params.data.workload_image;
  }

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  isPressureOverusage(name: string, option: 'Agent' | 'Controller') {
    return [`${option}.Memory.Pressure`, `${option}.Memory.Overusage`].includes(
      name
    );
  }
}
