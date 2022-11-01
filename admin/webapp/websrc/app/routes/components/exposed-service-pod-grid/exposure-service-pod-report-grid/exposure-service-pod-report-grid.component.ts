import { Component, OnInit, Input } from '@angular/core';
import { ErrorResponse, HierarchicalExposure } from '@common/types';
import { groupBy } from '@common/utils/common.utils';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  selector: 'app-exposure-service-pod-report-grid',
  templateUrl: './exposure-service-pod-report-grid.component.html',
  styleUrls: ['./exposure-service-pod-report-grid.component.scss']
})
export class ExposureServicePodReportGridComponent implements OnInit {

  @Input() reportGridData: Array<HierarchicalExposure>;
  groupedGridData: any;
  colourMap: any = MapConstant.colourMap;

  constructor() { }

  ngOnInit(): void {
    this.groupedGridData = Object.values(groupBy(JSON.parse(JSON.stringify(this.reportGridData)), 'service'));
    this.groupedGridData = this.groupedGridData.map(serviceGroup => {
      return serviceGroup.filter(row => row.service).map((row, index) => {
        if (index === 0) {
          row.rowspan = serviceGroup.length;
        } else {
          delete row.service
        }
        if (row.ports) row.applications = row.applications.concat(row.ports);
        row.applications = row.applications.join(', ');
        return row;
      });
    });
    this.groupedGridData = this.groupedGridData.flat();
    console.log("groupedGridData", this.groupedGridData);
  }

}
