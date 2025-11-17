import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { Group, NetworkRule, ResponseRule, Service } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { GlobalConstant } from '@common/constants/global.constant';
import { pluck } from 'rxjs/operators';

@Injectable()
export class PolicyHttpService {
  getFedGroups(): Observable<Group[]> {
    return GlobalVariable.http.get<Group[]>(PathConstant.GROUP_URL, {
      params: { scope: 'fed' },
    });
  }

  getGroups(params?: any): Observable<Group[]> {
    if (params)
      return GlobalVariable.http.get<Group[]>(PathConstant.GROUP_URL, {
        params,
      });
    return GlobalVariable.http.get<Group[]>(PathConstant.GROUP_URL);
  }

  getGroupList(scope: string) {
    return GlobalVariable.http.get(PathConstant.GROUP_LIST_URL, {
      params: { scope },
    });
  }

  getGroup(name: string): Observable<Group> {
    return GlobalVariable.http
      .get<Group>(PathConstant.GROUP_URL, {
        params: { name },
      })
      .pipe(pluck('group'));
  }

  postGroup(payload) {
    return GlobalVariable.http.post(PathConstant.GROUP_URL, payload);
  }

  patchGroup(payload) {
    return GlobalVariable.http.patch(PathConstant.GROUP_URL, payload);
  }

  deleteGroup(name: string) {
    return GlobalVariable.http.delete(PathConstant.GROUP_URL, {
      params: { name },
    });
  }

  getPolicyRule(id: number): Observable<NetworkRule> {
    return GlobalVariable.http.get<NetworkRule>(PathConstant.POLICY_RULE_URL, {
      params: { id },
    });
  }

  getResponseRule(id: number): Observable<ResponseRule> {
    return GlobalVariable.http.get<ResponseRule>(
      PathConstant.RESPONSE_RULE_URL,
      {
        params: { id },
      }
    );
  }

  getServices(params?: any): Observable<Service[]> {
    if (params) {
      return GlobalVariable.http
        .get<Service[]>(PathConstant.SERVICE_URL, {
          params,
        })
        .pipe(pluck('services'));
    }
    return GlobalVariable.http
      .get<Service[]>(PathConstant.SERVICE_URL)
      .pipe(pluck('services'));
  }

  getService(name: string): Observable<Service> {
    return GlobalVariable.http
      .get<Service>(PathConstant.SERVICE_URL, { params: { name } })
      .pipe(pluck('service'));
  }

  patchService(payload, config?) {
    if (config)
      return GlobalVariable.http.patch(
        PathConstant.SERVICE_URL,
        payload,
        config
      );
    return GlobalVariable.http.patch(PathConstant.SERVICE_URL, payload);
  }

  patchServiceAll(payload) {
    return GlobalVariable.http.patch(PathConstant.SERVICE_ALL, payload);
  }

  postGroupExport(payload, source) {
    return GlobalVariable.http.post(
      source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? PathConstant.GROUP_EXPORT_FED_URL
        : PathConstant.GROUP_EXPORT_URL,
      payload,
      {
        observe: 'response',
        responseType: 'text',
      }
    );
  }

  getGroupScript(name: string) {
    return GlobalVariable.http
      .get(PathConstant.GROUP_SCRIPT_URL, { params: { name } })
      .pipe(pluck('config'));
  }

  patchGroupScript(payload) {
    return GlobalVariable.http.patch(PathConstant.GROUP_SCRIPT_URL, payload);
  }

  getDLPGroups(name: string) {
    return GlobalVariable.http
      .get(PathConstant.DLP_GROUPS_URL, { params: { name } })
      .pipe(pluck('dlp_group'));
  }

  patchDLPGroup(payload) {
    return GlobalVariable.http.patch(PathConstant.DLP_GROUPS_URL, payload);
  }

  getDLPSensors(source) {
    const options: any = [];
    if (source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
      options.push({
        params: {
          scope: 'fed',
        },
      });
    } else {
      options.push({
        params: {
          scope: 'local',
        },
      });
    }
    return GlobalVariable.http
      .get(PathConstant.DLP_SENSORS_URL, ...options)
      .pipe(pluck('sensors'));
  }

  getWAFGroups(name: string) {
    return GlobalVariable.http
      .get(PathConstant.WAF_GROUPS_URL, { params: { name } })
      .pipe(pluck('waf_group'));
  }

  patchWAFGroup(payload) {
    return GlobalVariable.http.patch(PathConstant.WAF_GROUPS_URL, payload);
  }

  getWAFSensors(source) {
    const options: any = [];
    if (source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
      options.push({
        params: {
          scope: 'fed',
        },
      });
    } else {
      options.push({
        params: {
          scope: 'local',
        },
      });
    }
    return GlobalVariable.http
      .get(PathConstant.WAF_SENSORS_URL, ...options)
      .pipe(pluck('sensors'));
  }
}
