import { Component, OnInit, Input } from '@angular/core';
import { ErrorResponse, HierarchicalExposure } from '@common/types';
import { groupBy } from '@common/utils/common.utils';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-exposure-service-pod-report-grid',
  templateUrl: './exposure-service-pod-report-grid.component.html',
  styleUrls: ['./exposure-service-pod-report-grid.component.scss'],
  
})
export class ExposureServicePodReportGridComponent implements OnInit {
  @Input() reportGridData: Array<any>;
  groupedGridData: any;
  colourMap: any = MapConstant.colourMap;

  constructor() {}

  ngOnInit(): void {
    this.groupedGridData = this.preprocessHierarchicalData(this.reportGridData);
    console.log('this.groupedGridData', this.groupedGridData);
  }

  preprocessHierarchicalData = (
    exposures: Array<HierarchicalExposure>
  ): Array<any> => {
    let res: Array<any> = [];
    exposures.forEach(exposure => {
      exposure.entries?.forEach((child, index) => {
        if (index === 0) {
          res.push({
            service: exposure.service,
            pods: exposure.children.length,
            policy_mode: exposure.policy_mode,
            rowSpan: exposure.entries.length,
            high: exposure.high,
            medium: exposure.medium,
            ...child,
          });
        } else {
          res.push({
            ...child,
          });
        }
      });
    });
    console.log('preprocessHierarchicalData', res);
    return res;
  };
}
