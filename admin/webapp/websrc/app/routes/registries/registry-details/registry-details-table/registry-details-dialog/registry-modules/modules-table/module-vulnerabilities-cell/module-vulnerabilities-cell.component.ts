import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-module-vulnerabilities-cell',
  templateUrl: './module-vulnerabilities-cell.component.html',
  styleUrls: ['./module-vulnerabilities-cell.component.scss'],
  
})
export class ModuleVulnerabilitiesCellComponent
  implements ICellRendererAngularComp
{
  fixed!: number;
  fixable!: number;

  agInit(params: any): void {
    this.fixed = this.setFixed(params);
    this.fixable = this.setFixable(params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  setFixed(params): number {
    return params.node.data.cves?.length || 0;
  }

  setFixable(params): number {
    if (!params.node.data.cves?.length) {
      return 0;
    }
    let total = 0;
    for (const cve of params.node.data.cves) {
      if (cve.status === 'fix exists') {
        total++;
      }
    }
    return total;
  }
}
