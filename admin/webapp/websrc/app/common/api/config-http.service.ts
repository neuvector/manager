import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import {
  ConfigPatch,
  ConfigV2Response,
  DebugPostBody,
  IBMSetupGetResponse,
  RemoteRepository,
  RemoteRepositoryWrapper,
  UsageReport,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { pluck, catchError } from 'rxjs/operators';

@Injectable()
export class ConfigHttpService {
  private configV2ResponseSubject$ = new BehaviorSubject<
    ConfigV2Response | undefined
  >(undefined);
  configV2$ = this.configV2ResponseSubject$.asObservable();
  setConfigV2(configV2: ConfigV2Response): void {
    this.configV2ResponseSubject$.next(configV2);
  }

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
    return GlobalVariable.http
      .get<ArrayBuffer>(PathConstant.SYSTEM_CONFIG_URL, options)
      .pipe(
        catchError(error => {
          const textDecoder = new TextDecoder();
          let errorRes = textDecoder.decode(error.error);
          error.error =
            error.headers.get('Content-type') === 'application/json'
              ? JSON.parse(errorRes).message
              : errorRes;
          return throwError(error);
        })
      );
  }

  getUsageReport(): Observable<UsageReport> {
    return GlobalVariable.http.get<UsageReport>(PathConstant.USAGE_REPORT_URL);
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
    return GlobalVariable.http
      .get<ArrayBuffer>(PathConstant.SYSTEM_DEBUG_URL, {
        responseType: 'arraybuffer' as any,
      })
      .pipe(
        catchError(error => {
          const textDecoder = new TextDecoder();
          let errorRes = textDecoder.decode(error.error);
          error.error =
            error.headers.get('Content-type') === 'application/json'
              ? JSON.parse(errorRes).message
              : errorRes;
          return throwError(error);
        })
      );
  }

  getCspSupport() {
    const options = {
      responseType: 'arraybuffer' as any,
      cache: false,
      headers: { 'Cache-Control': 'no-store' },
      observe: 'response' as any,
    };
    return GlobalVariable.http
      .post(PathConstant.CSP_SUPPORT_URL, null, options)
      .pipe(
        catchError(error => {
          const textDecoder = new TextDecoder();
          let errorRes = textDecoder.decode(error.error);
          error.error =
            error.headers.get('Content-type') === 'application/json'
              ? JSON.parse(errorRes).message
              : errorRes;
          return throwError(error);
        })
      );
  }

  postRemoteRepository(payload: RemoteRepository): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(
      PathConstant.REMOTE_REPO_URL,
      payload
    );
  }

  patchRemoteRepository(payload: RemoteRepositoryWrapper): Observable<unknown> {
    return GlobalVariable.http.patch<unknown>(
      PathConstant.REMOTE_REPO_URL,
      payload
    );
  }

  deleteRemoteRepositoryByName(name: string): Observable<unknown> {
    return GlobalVariable.http.delete<unknown>(PathConstant.REMOTE_REPO_URL, {
      params: { name },
    });
  }
}
