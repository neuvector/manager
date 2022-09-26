import { Component, OnInit, Input } from '@angular/core';
import { InternalSystemInfo, HierarchicalExposure } from '@common/types';
import { parseExposureHierarchicalData } from '@common/utils/common.utils';

@Component({
  selector: 'app-exposure-panel',
  templateUrl: './exposure-panel.component.html',
  styleUrls: ['./exposure-panel.component.scss'],
})
export class ExposurePanelComponent implements OnInit {
  @Input() scoreInfo!: InternalSystemInfo;
  hierarchicalIngressList!: Array<HierarchicalExposure>;
  hierarchicalEgressList!: Array<HierarchicalExposure>;

  constructor() {}

  ngOnInit(): void {
    this.hierarchicalIngressList = parseExposureHierarchicalData(
      this.scoreInfo.ingress
    );
    this.hierarchicalEgressList = parseExposureHierarchicalData(
      this.scoreInfo.egress
    );
  }
}
