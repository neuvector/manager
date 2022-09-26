import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PathConstant } from '../constants/path.constant';
import { GlobalVariable } from '../variables/global.variable';
import {
  EntryPostBody,
  ImageGetResponse,
  LayerGetResponse,
  RegistryGetResponse,
  RegistryPatchBody,
  RegistryPostBody,
  RepoGetResponse,
} from '@common/types';
import { HttpHeaders } from '@angular/common/http';

@Injectable()
export class RegistriesService {
  getRegistries(): Observable<RegistryGetResponse> {
    return GlobalVariable.http.get<RegistryGetResponse>(
      PathConstant.REGISTRY_SCAN_URL
    );
  }

  postRegistry(body: RegistryPostBody): Observable<unknown> {
    return GlobalVariable.http.post<unknown>(
      PathConstant.REGISTRY_SCAN_URL,
      body
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
    return GlobalVariable.http.patch<unknown>(
      PathConstant.REGISTRY_SCAN_URL,
      body
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
}
