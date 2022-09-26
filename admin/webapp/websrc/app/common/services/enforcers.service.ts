import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Enforcer } from '@common/types';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { ConfigHttpService } from '@common/api/config-http.service';

@Injectable()
export class EnforcersService {
  public enforcers: Enforcer[] = [];

  constructor(
    private assetsHttpService: AssetsHttpService,
    private configHttpService: ConfigHttpService
  ) {}

  getEnforcers() {
    return this.assetsHttpService.getEnforcers();
  }

  getEnforcerStats(id: string) {
    return this.assetsHttpService.getEnforcerStats(id);
  }

  getUsageReport() {
    return this.configHttpService.getUsageReport();
  }

  postSystemDebug(body: string) {
    return this.configHttpService.postSystemDebug(body);
  }

  checkDebug() {
    return this.configHttpService.checkDebug();
  }

  getDebug(): Observable<ArrayBuffer> {
    return this.configHttpService.getDebug();
  }
}
