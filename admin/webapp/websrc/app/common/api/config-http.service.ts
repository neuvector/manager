import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import {
  ConfigDebug,
  ConfigPatch,
  ConfigResponse,
  DebugPostBody,
  IBMSetupGetResponse,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

@Injectable()
export class ConfigHttpService {
  getConfig(): Observable<ConfigResponse> {
    return GlobalVariable.http
      .get<ConfigResponse>(PathConstant.CONFIG_URL)
      .pipe(pluck('config'));
  }

  patchConfig(body: ConfigPatch): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.CONFIG_V2_URL, body);
  }

  patchConfigAny(body): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(PathConstant.CONFIG_V2_URL, body);
  }

  getIBMSetup(): Observable<IBMSetupGetResponse> {
    return GlobalVariable.http.get<IBMSetupGetResponse>(
      PathConstant.IBM_SETUP_URL
    );
  }

  getSystemConfig(exportMode): Observable<ArrayBuffer> {
    const options = {
      params: { id: exportMode },
      responseType: 'arraybuffer' as any,
      cache: false,
      headers: { 'Cache-Control': 'no-store' },
    };
    return GlobalVariable.http.get<ArrayBuffer>(
      PathConstant.SYSTEM_CONFIG_URL,
      options
    );
  }

  getUsageReport(): Observable<unknown> {
    return GlobalVariable.http
      .get<unknown>(PathConstant.USAGE_REPORT_URL)
      .pipe(pluck('usage'));
  }

  postSystemDebug(body: string): Observable<unknown> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
    });
    return GlobalVariable.http.post<unknown>(
      PathConstant.SYSTEM_DEBUG_URL,
      body,
      { headers }
    );
  }

  postDebug(body: DebugPostBody): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.DEBUG_URL, body);
  }

  checkDebug(): Observable<HttpResponse<unknown>> {
    return GlobalVariable.http.get<HttpResponse<unknown>>(
      PathConstant.DEBUG_CHECK_URL,
      { observe: 'response' }
    );
  }

  getDebug(): Observable<ArrayBuffer> {
    return GlobalVariable.http.get<ArrayBuffer>(PathConstant.SYSTEM_DEBUG_URL, {
      responseType: 'arraybuffer' as any,
    });
  }
}
