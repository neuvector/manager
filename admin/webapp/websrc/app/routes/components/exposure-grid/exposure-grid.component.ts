import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { HierarchicalExposure } from '@common/types';
import { ExposedServicePodGridComponent } from '@components/exposed-service-pod-grid/exposed-service-pod-grid.component';

@Component({
  selector: 'app-exposure-grid',
  templateUrl: './exposure-grid.component.html',
  styleUrls: ['./exposure-grid.component.scss'],
})
export class ExposureGridComponent implements OnInit {
  @ViewChild('ingressGrid') ingressGrid!: ExposedServicePodGridComponent;
  @ViewChild('egressGrid') egressGrid!: ExposedServicePodGridComponent;
  @Input() source: string;
  @Input() ingress!: Array<any>;
  @Input() egress!: Array<any>;
  @Input() selectedIndex: number = 0;
  @Input() clearSession: boolean = false;

  constructor() {}

  ngOnInit(): void {}

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
