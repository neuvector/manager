import { Injectable } from '@angular/core';
import { Scanner } from '@common/types';
import { AssetsHttpService } from '@common/api/assets-http.service';

@Injectable()
export class ScannersService {
  public scanners: Scanner[] = [];

  constructor(private assetsHttpService: AssetsHttpService) {}

  getScanners() {
    return this.assetsHttpService.getScanners();
  }
}
