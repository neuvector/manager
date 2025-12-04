import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-group-waf-config-action-button',
  templateUrl: './group-waf-config-action-button.component.html',
  styleUrls: ['./group-waf-config-action-button.component.scss'],
})
export class GroupWafConfigActionButtonComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  toggleAction = () => {
    this.params.data.isAllowed = !this.params.data.isAllowed;
    let selectedNodes =
      this.params.context.componentParent.selectedWafSensorNodes;
    selectedNodes.forEach(node => {
      node.setSelected(true);
    });
  };
}
