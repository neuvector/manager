import { Injectable } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { Platform } from '@common/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PlatformsService {
  private _platforms: Platform[] = [];
  get platforms() {
    return this._platforms;
  }
  set platforms(platforms: Platform[]) {
    this._platforms = platforms;
  }

  constructor(private assetsHttpService: AssetsHttpService) {}

  resetPlatforms(): void {
    this.platforms = [];
  }

  getPlatforms(): Observable<Platform[]> {
    return this.assetsHttpService.getPlatform().pipe(map(r => r.platforms));
  }
}
