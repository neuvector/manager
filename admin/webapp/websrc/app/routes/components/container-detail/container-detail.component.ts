import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalConstant } from '@common/constants/global.constant';
import { IpAddr } from '@common/types/compliance/ipAddr';
import { validateIPAddress } from '@common/utils/common.utils';
import { WorkloadRow } from '@services/containers.service';
import { RegistriesService } from '@services/registries.service';


@Component({
  standalone: false,
  selector: 'app-container-detail',
  templateUrl: './container-detail.component.html',
  styleUrls: ['./container-detail.component.scss'],
  
})
export class ContainerDetailComponent {
  @Input() container!: WorkloadRow;
  get labels() {
    return Object.keys(this.container.rt_attributes.labels || {});
  }
  get MAX_INTERFACE_IP() {
    return GlobalConstant.MAX_INTERFACE_IP;
  }

  constructor(
    private router: Router,
    private registriesService: RegistriesService
  ) {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }

  validateIP(ip: IpAddr) {
    return validateIPAddress(ip.ip);
  }

  redirectToRegistry(imageId: string) {
    this.registriesService.getAllScannedImagesSummary().subscribe(data => {
      this.registriesService
        .getAllScannedImages(data.queryToken, 0, 1, [], {
          '-': {
            filter: imageId,
          },
        })
        .subscribe(images => {
          if (
            images.data &&
            images.data.length > 0 &&
            images.data[0].reg_name
          ) {
            const image = images.data[0];
            this.router.navigate(['/regScan'], {
              queryParams: {
                registry: image.reg_name,
                image: image.repository,
                tag: image.tag,
              },
            });
          }
        });
    });
  }
}
