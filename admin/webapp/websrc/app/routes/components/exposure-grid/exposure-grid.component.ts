import { Component, Input, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ExposedServicePodGridComponent } from '@components/exposed-service-pod-grid/exposed-service-pod-grid.component';

@Component({
  standalone: false,
  selector: 'app-exposure-grid',
  templateUrl: './exposure-grid.component.html',
  styleUrls: ['./exposure-grid.component.scss'],
})
export class ExposureGridComponent {
  @ViewChild('ingressGrid') ingressGrid!: ExposedServicePodGridComponent;
  @ViewChild('egressGrid') egressGrid!: ExposedServicePodGridComponent;

  @Input() isIpMapReady: any;
  @Input() source: string;
  @Input() ingress!: Array<any>;
  @Input() egress!: Array<any>;
  @Input() selectedIndex: number = 0;
  @Input() clearSession: boolean = false;

  constructor() {}

  updateGrid(grid: ExposedServicePodGridComponent) {
    if (grid) grid.gridApi?.sizeColumnsToFit();
  }

  tabChanged(event: MatTabChangeEvent) {
    this.selectedIndex = event.index;
    switch (this.selectedIndex) {
      case 0:
        this.updateGrid(this.ingressGrid);
        break;
      case 1:
        this.updateGrid(this.egressGrid);
        break;
    }
  }
}
