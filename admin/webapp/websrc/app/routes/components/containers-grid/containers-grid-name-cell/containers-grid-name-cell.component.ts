import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-containers-grid-name-cell',
  templateUrl: './containers-grid-name-cell.component.html',
  styleUrls: ['./containers-grid-name-cell.component.scss'],
  
})
export class ContainersGridNameCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  name!: string;
  isParent!: boolean;
  get isChildVisible() {
    return this.params.data.visible;
  }

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.name = params.data.brief.display_name;
    this.isParent =
      !params.data.parent_id &&
      params.data.child_ids &&
      params.data.child_ids.length > 0;
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
