import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import {
  ConfigDebug,
  ConfigPatch,
  ConfigResponse,
  ConfigV2,
  ConfigV2Response,
  DebugPostBody,
  IBMSetupGetResponse,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable, throwError } from 'rxjs';
import { pluck, catchError } from 'rxjs/operators';

@Injectable()
export class ConfigHttpService {
  getConfig(): Observable<ConfigV2Response> {
    return GlobalVariable.http
      .get<ConfigV2Response>(PathConstant.CONFIG_V2_URL)
      .pipe(pluck('config'));
  }

  getFedConfig(): Observable<any> {
    return GlobalVariable.http
      .get(PathConstant.CONFIG_URL, { params: { scope: 'fed' } })
      .pipe();
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
    const requestOptions: Object = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json;charset=UTF-8',
      }),
      responseType: 'text',
    };
    return GlobalVariable.http.post<unknown>(
      PathConstant.SYSTEM_DEBUG_URL,
      body,
      requestOptions
    );
  }

  postDebug(body: DebugPostBody): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(PathConstant.DEBUG_URL, body);
  }

  checkDebug(): Observable<HttpResponse<unknown>> {
    const requestOptions: Object = {
      observe: 'response',
      responseType: 'text',
    };
    return GlobalVariable.http.get<HttpResponse<unknown>>(
      PathConstant.DEBUG_CHECK_URL,
      requestOptions
    );
  }

  getDebug(): Observable<ArrayBuffer> {
    return GlobalVariable.http.get<ArrayBuffer>(PathConstant.SYSTEM_DEBUG_URL, {
      responseType: 'arraybuffer' as any,
    });
  }

  getCspSupport() {
    const options = {
      responseType: 'arraybuffer' as any,
      cache: false,
      headers: { 'Cache-Control': 'no-store' },
      observe: 'response' as any
    };
    return GlobalVariable.http.post(
      PathConstant.CSP_SUPPORT_URL,
      null,
      options
    ).pipe(
      catchError(error => {
        const textDecoder = new TextDecoder();
        let errorRes = textDecoder.decode(error.error);
        error.error = typeof errorRes === 'string' ? errorRes : JSON.parse(errorRes);
        return throwError(error);
      })

    );
  }
}
