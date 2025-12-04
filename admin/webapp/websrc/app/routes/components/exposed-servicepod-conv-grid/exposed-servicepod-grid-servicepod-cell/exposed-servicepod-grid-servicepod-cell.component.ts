import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { accumulateActionLevel } from '@common/utils/common.utils';


@Component({
  standalone: false,
  selector: 'app-exposed-servicepod-grid-servicepod-cell',
  templateUrl: './exposed-servicepod-grid-servicepod-cell.component.html',
  styleUrls: ['./exposed-servicepod-grid-servicepod-cell.component.scss'],
  
})
export class ExposedServicepodGridServicepodCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  name!: string;
  isParent!: boolean;
  isIpMapReady!: boolean;
  rowStyle: any;
  get isChildVisible() {
    return this.params.data.visible;
  }

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isParent = !params.data.parent_id && params.data.child_id;
    this.isIpMapReady = params.data.isIpMapReady;
    this.name = params.data.service;
    if (params.data.service)
      this.rowStyle = this.getServicePodStyle(this.params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  toggleVisible(): void {
    this.params.data.visible = !this.params.data.visible;
    const child_node = this.params.api.getRowNode(this.params.data.child_id);
    if (child_node) child_node.data.visible = !child_node.data.visible;
    this.params.api.onFilterChanged();
  }

  private getServicePodStyle = params => {
    const colorArray = [
      'text-danger',
      'text-warning',
      'text-caution',
      'text-monitor',
      'text-protect',
    ];
    const levelMap = {
      protect: 4,
      monitor: 3,
      discover: 2,
      violate: 1,
      warning: 1,
      deny: 0,
      critical: 0,
    };
    const actionTypeIconMap = {
      discover: 'fa icon-size-2 fa-exclamation-triangle',
      violate: 'fa icon-size-2 fa-ban',
      protect: 'fa icon-size-2 fa-shield',
      monitor: 'fa icon-size-2 fa-bell',
      deny: 'fa icon-size-2 fa-minus-circle',
      threat: 'fa icon-size-2 fa-bug',
    };

    let actionType = '';
    let level: number[] = [];
    this.params.data.policy_action = 'allow';
    this.params.data.entries.forEach(entry => {
      this.params.data.policy_action = accumulateActionLevel(
        this.params.data.policy_action,
        entry.policy_action
      );
    });

    if (this.params.data.severity) {
      level.push(levelMap[this.params.data.severity.toLowerCase()]);
    } else if (
      this.params.data.policy_action &&
      (this.params.data.policy_action.toLowerCase() === 'deny' ||
        this.params.data.policy_action.toLowerCase() === 'violate')
    ) {
      level.push(levelMap[this.params.data.policy_action.toLowerCase()]);
      actionType =
        actionTypeIconMap[this.params.data.policy_action.toLowerCase()];
    } else {
      if (!this.params.data.policy_mode)
        this.params.data.policy_mode = 'discover';
      level.push(levelMap[this.params.data.policy_mode.toLowerCase()]);
      actionType =
        actionTypeIconMap[this.params.data.policy_mode.toLowerCase()];
    }
    let serviceColor = colorArray[Math.min(...level)];
    return {
      color: serviceColor,
      actionIcon: actionType,
    };
  };
}
