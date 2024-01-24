import { Inject, Injectable } from '@angular/core';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { Router } from '@angular/router';
import { GlobalVariable } from '@common/variables/global.variable';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    console.log('Auth intercepting...');
    let authToken;
    try {
      authToken = this.localStorage.has(GlobalConstant.LOCAL_STORAGE_TOKEN)
        ? this.localStorage.get(GlobalConstant.LOCAL_STORAGE_TOKEN).token.token
        : '';
      if (
        !(
          req.url.indexOf(PathConstant.LOGIN_URL) >= 0 &&
          typeof req.method === 'string' &&
          req.method === 'POST'
        )
      ) {
        if (authToken === '') {
          this.router.navigate([GlobalConstant.PATH_LOGIN]);
        } else {
          const authReq = req.clone({
            headers: req.headers
              .set(GlobalConstant.LOCAL_STORAGE_TOKEN, authToken)
              .set('Cache-Control', 'no-cache')
              .set('Pragma', 'no-cache'),
          });
          return next.handle(authReq);
        }
      }
    } catch (e) {
      if (GlobalVariable.isSUSESSO) {
        this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TOKEN);
        this.router.navigate([GlobalConstant.PATH_LOGOUT]);
      } else {
        this.router.navigate([GlobalConstant.PATH_LOGIN]);
      }
    }

    return next.handle(req);
  }
}
