import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Location } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { AuthService } from '@common/services/auth.service';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private location: Location,
    private auth: AuthService,
    private dialog: MatDialog,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService
  ) {
    this.location = location;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // console.log('Timeout intecepting...');

    return next.handle(req).pipe(
      tap(
        event => {
          // console.log('normal:', event);
        },
        error => {
          console.error(error, this.location.path());
          let status: number = error.status;
          let currentPath: string = this.location.path();
          if (
            status === GlobalConstant.STATUS_AUTH_TIMEOUT ||
            status === GlobalConstant.STATUS_UNAUTH ||
            (status === GlobalConstant.STATUS_SERVER_UNAVAILABLE &&
              currentPath !== GlobalConstant.PATH_LOGIN &&
              currentPath !== GlobalConstant.PATH_MULTICLUSTER) ||
            req.url === PathConstant.TOKEN_AUTH ||
            req.url === PathConstant.SELF_URL
          ) {
            this.localStorage.set(
              GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL,
              currentPath
            );
            this.dialog.closeAll();
            if (error.error.code === 51) {
              this.auth.logout(false, true);
            } else {
              this.localStorage.set(GlobalConstant.LOCAL_STORAGE_TIMEOUT, true);
              this.auth.timeout(currentPath);
            }
          }
        }
      )
    );
  }
}
