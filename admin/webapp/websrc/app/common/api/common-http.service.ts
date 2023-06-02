import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { SystemSummary } from '@common/types';
import { toBoolean } from '@common/utils/common.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CommonHttpService {
  getVersion() {
    return GlobalVariable.http.get(PathConstant.MGR_VERSION, {
      responseType: 'text',
    });
  }

  getSummary() {
    return GlobalVariable.http.get<SystemSummary>(
      PathConstant.DASHBOARD_SUMMARY_URL
    );
  }

  getGravatar(): Observable<boolean> {
    return GlobalVariable.http
      .get(PathConstant.GRAVATAR, {
        responseType: 'text',
      })
      .pipe(map(val => toBoolean(val)));
  }

  getCustomLoginLogo(): Observable<string> {
    return GlobalVariable.http.get(PathConstant.CUSTOM_LOGIN_LOGO, {
      responseType: 'text',
    });
  }

  getCustomPageHeader(): Observable<string> {
    return GlobalVariable.http.get(PathConstant.CUSTOM_PAGE_HEADER, {
      responseType: 'text',
    });
  }

  getCustomEULAPrompt(): Observable<string> {
    return GlobalVariable.http.get(PathConstant.CUSTOM_EULA_PROMPT, {
      responseType: 'text',
    });
  }

  getCustomEULAPolicy(): Observable<string> {
    return GlobalVariable.http.get(PathConstant.CUSTOM_EULA_POLICY, {
      responseType: 'text',
    });
  }
}
