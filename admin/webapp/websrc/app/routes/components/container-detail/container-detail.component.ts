import { Component, Input, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { IpAddr } from '@common/types/compliance/ipAddr';
import { validateIPAddress } from '@common/utils/common.utils';
import { WorkloadRow } from '@services/containers.service';

@Component({
  selector: 'app-container-detail',
  templateUrl: './container-detail.component.html',
  styleUrls: ['./container-detail.component.scss'],
})
export class ContainerDetailComponent implements OnInit {
  @Input() container!: WorkloadRow;
  get labels() {
    return Object.keys(this.container.rt_attributes.labels || {});
  }
  get MAX_INTERFACE_IP() {
    return GlobalConstant.MAX_INTERFACE_IP;
  }

  constructor() {}

  ngOnInit(): void {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }

  validateIP(ip: IpAddr) {
    return validateIPAddress(ip.ip);
  }
}
