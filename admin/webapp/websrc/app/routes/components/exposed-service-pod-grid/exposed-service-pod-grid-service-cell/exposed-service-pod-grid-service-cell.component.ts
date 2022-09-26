import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-exposed-service-pod-grid-service-cell',
  templateUrl: './exposed-service-pod-grid-service-cell.component.html',
  styleUrls: ['./exposed-service-pod-grid-service-cell.component.scss']
})
export class ExposedServicePodGridServiceCellComponent implements ICellRendererAngularComp {

  params!: ICellRendererParams;
  name!: string;
  isParent!: boolean;
  get isChildVisible() {
    return this.params.data.visible;
  }

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.name = params.data.isParent ? params.data.service : params.data.display_name;
    this.isParent = params.data.isParent;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  toggleVisible(): void {
    this.params.data.visible = !this.params.data.visible;
    this.params.data.child_ids.forEach(child_id => {
      const child_node = this.params.api.getRowNode(child_id);
      if (child_node) child_node.data.visible = !child_node.data.visible;
    });
    this.params.api.onFilterChanged();
  }
}
