import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-compliance-grid-category-cell',
  templateUrl: './compliance-grid-category-cell.component.html',
  styleUrls: ['./compliance-grid-category-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class ComplianceGridCategoryCellComponent
  implements ICellRendererAngularComp
{
  params: any;
  category!: string;
  isParent!: boolean;
  get isChildVisible() {
    return this.params.data.visible;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.category = this.params.data.category;
    this.isParent =
      !params.data.parent_id &&
      params.data.child_ids &&
      params.data.child_ids.length > 0;
    // Support OpenShift CIS version
    if (this.params.kubeType && this.params.kubeType.includes('-')) {
      this.category = this.params.kubeType.split('-')[0];
    }
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
