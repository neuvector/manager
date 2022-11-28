import { Inject, Injectable } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService
  ) {}

  clearSession() {
    let globalNotifs = this.sessionStorage.get(
      GlobalConstant.SESSION_STORAGE_NOTIFICATIONS
    );
    this.sessionStorage.clear();
    if (globalNotifs) {
      this.sessionStorage.set(
        GlobalConstant.SESSION_STORAGE_NOTIFICATIONS,
        globalNotifs
      );
    }
  }
}
