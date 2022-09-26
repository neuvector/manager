import { Injectable } from '@angular/core';
import { Controller } from '@common/types';
import { AssetsHttpService } from '@common/api/assets-http.service';

@Injectable()
export class ControllersService {
  public controllers: Controller[] = [];

  constructor(private assetsHttpService: AssetsHttpService) {}

  getControllers() {
    return this.assetsHttpService.getControllers();
  }

  getControllerStats(id: string) {
    return this.assetsHttpService.getControllerStats(id);
  }
}
