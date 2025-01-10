import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PathConstant } from '../constants/path.constant';
import { GlobalVariable } from '../variables/global.variable';
import {
  EntryPostBody,
  ImageGetResponse,
  LayerGetResponse,
  RegistryTypeResponse,
  RegistryGetResponse,
  RegistryPatchBody,
  RegistryPostBody,
  RepoGetResponse,
  RegistryConfig,
  RegistryConfigV2,
  VulnerabilitiesQueryData,
  AllScannedImages,
} from '@common/types';
import { HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { SortModelItem } from 'ag-grid-community';

@Injectable()
export class RegistriesService {
  getRegistryTypes(): Observable<RegistryTypeResponse> {
    return GlobalVariable.http.get<RegistryTypeResponse>(
      PathConstant.REGISTRY_TYPE_URL
    );
  }

  getRegistries(): Observable<RegistryGetResponse> {
    return GlobalVariable.http.get<RegistryGetResponse>(
      PathConstant.REGISTRY_SCAN_URL
    );
  }

  postRegistry(body: RegistryPostBody): Observable<unknown> {
    let bodyV2 = {
      config: this.convertRegistryConfigV2(body.config),
    };
    return GlobalVariable.http.post<unknown>(
      PathConstant.REGISTRY_SCAN_URL,
      bodyV2
    );
  }

  testSettings(body: any, transactionId?: string): Observable<unknown> {
    let headers: HttpHeaders | undefined;
    if (transactionId) {
      headers = new HttpHeaders({
        'X-Transaction-Id': transactionId,
      });
    }
    return GlobalVariable.http.post<unknown>(PathConstant.REGISTRY_TEST, body, {
      headers,
      observe: 'response',
    });
  }

  deleteTestSettings(name: string, transactionId?: string) {
    let headers: HttpHeaders | undefined;
    if (transactionId) {
      headers = new HttpHeaders({
        'X-Transaction-Id': transactionId,
      });
    }
    return GlobalVariable.http.delete(PathConstant.REGISTRY_TEST, {
      headers,
      params: { name },
    });
  }

  deleteRegistry(name: string): Observable<unknown> {
    return GlobalVariable.http.delete<unknown>(PathConstant.REGISTRY_SCAN_URL, {
      params: {
        name,
      },
    });
  }

  stopScanning(name: string): Observable<unknown> {
    return GlobalVariable.http.delete<unknown>(
      PathConstant.REGISTRY_SCAN_REPO_URL,
      {
        params: {
          name,
        },
      }
    );
  }

  startScanning(name: string): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(
      PathConstant.REGISTRY_SCAN_REPO_URL,
      name
    );
  }

  patchRegistry(body: RegistryPatchBody): Observable<unknown> {
    let bodyV2 = {
      wrap: {
        config: this.convertRegistryConfigV2(body.wrap.config),
      },
      name: body.name,
    };
    return GlobalVariable.http.patch<unknown>(
      PathConstant.REGISTRY_SCAN_URL,
      bodyV2
    );
  }

  getRepo(name: string): Observable<RepoGetResponse> {
    return GlobalVariable.http.get<RepoGetResponse>(
      PathConstant.REGISTRY_SCAN_REPO_URL,
      {
        params: {
          name,
        },
      }
    );
  }

  getLayer(
    name: string,
    imageId: string,
    show?: boolean
  ): Observable<LayerGetResponse> {
    const options: {
      params: {
        imageId: string;
        name: string;
        show?: string;
      };
    } = {
      params: {
        imageId,
        name,
      },
    };
    if (show) {
      options.params.show = 'accepted';
    }
    return GlobalVariable.http.get<LayerGetResponse>(
      PathConstant.LAYER_URL,
      options
    );
  }

  getImage(
    name: string,
    imageId: string,
    show?: boolean
  ): Observable<ImageGetResponse> {
    const options: {
      params: {
        imageId: string;
        name: string;
        show?: string;
      };
    } = {
      params: {
        imageId,
        name,
      },
    };
    if (show) {
      options.params.show = 'accepted';
    }
    return GlobalVariable.http.get<ImageGetResponse>(
      PathConstant.REGISTRY_SCAN_IMAGE_URL,
      options
    );
  }

  acceptVulnerability(body: EntryPostBody): Observable<any> {
    return GlobalVariable.http.post<any>(PathConstant.CVE_PROFILE_ENTRY, body);
  }

  convertRegistryConfigV2(config: RegistryConfig): RegistryConfigV2 {
    return {
      name: config.name,
      registry_type: config.registry_type,
      registry: config.registry,
      filters: config.filters,
      cfg_type: config.cfg_type,
      auth: {
        username: config.username,
        password: config.password,
        auth_token: config.auth_token,
        auth_with_token: config.auth_with_token,
        aws_key: config.aws_key,
        gcr_key: config.gcr_key,
      },
      scan: {
        rescan_after_db_update: config.rescan_after_db_update,
        scan_layers: config.scan_layers,
        schedule: config.schedule,
        ignore_proxy: !config.use_proxy,
      },
      integrations: {
        jfrog_mode: config.jfrog_mode,
        gitlab_external_url: config.gitlab_external_url,
        gitlab_private_token: config.gitlab_private_token,
        ibm_cloud_account: config.ibm_cloud_account,
      },
    };
  }

  getAllScannedImagesSummary() {
    return GlobalVariable.http
      .post<VulnerabilitiesQueryData>(PathConstant.SCANNED_ASSETS_URL, {
        type: 'image',
      })
      .pipe(
        map(res => {
          return {
            queryToken: res.query_token,
            summary: res.summary,
            totalRecords: res.total_records,
          };
        })
      );
  }

  getAllScannedImages(
    token: string,
    start: number,
    row: number,
    sortModel: SortModelItem[],
    filterModel: any
  ) {
    let params: {
      token: string;
      start: number;
      row: number;
      orderbyColumn?: string;
      orderby?: string;
      qf?: string;
    } = {
      token,
      start,
      row,
    };
    if (sortModel.length)
      params = {
        ...params,
        orderbyColumn: sortModel![0].colId,
        orderby: sortModel![0].sort,
      };
    if ('-' in filterModel) {
      params = {
        ...params,
        qf: filterModel['-'].filter,
      };
    }
    return GlobalVariable.http
      .get<AllScannedImages>(PathConstant.SCANNED_ASSETS_URL, {
        params,
      })
      .pipe();
  }
}
