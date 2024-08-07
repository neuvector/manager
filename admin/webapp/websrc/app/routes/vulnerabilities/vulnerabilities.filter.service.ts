import { Injectable } from '@angular/core';
import {
  VulnerabilityAsset,
  VulnerabilityQuery,
  VulnerabilityView,
} from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MapConstant } from '@common/constants/map.constant';

@Injectable()
export class VulnerabilitiesFilterService {
  readonly matchTypes = [
    { id: 'equals', name: '=' },
    {
      id: 'contains',
      name: this.translate.instant('admissionControl.operators.CONTAINS'),
    },
  ];

  readonly dateTypes = [
    { id: 'before', name: this.translate.instant('general.BEFORE') },
    { id: 'after', name: this.translate.instant('general.AFTER') },
  ];
  vulQuerySubject$ = new BehaviorSubject<VulnerabilityQuery>(
    this.initVulQuery()
  );
  vulQuery$ = this.vulQuerySubject$.asObservable();
  private filteredSubject$ = new BehaviorSubject(false);
  filtered$ = this.filteredSubject$.asObservable();
  filteredCount: number = 0;
  qfCount!: number;
  selectedScore = 'V3';
  activePage: number = 0;
  paginationPageSize = 100;
  paginationBlockSize = 100;

  constructor(private translate: TranslateService) {}

  private _filtered = false;

  get filtered() {
    return this._filtered;
  }

  set filtered(val) {
    this._filtered = val;
    this.filteredSubject$.next(this._filtered);
  }

  private _filteredCis;

  get filteredCis() {
    return JSON.parse(JSON.stringify(this._filteredCis || '{}'));
  }

  set filteredCis(val) {
    this._filteredCis = val;
  }

  private _workloadMap;

  get workloadMap() {
    return this._workloadMap;
  }

  set workloadMap(val) {
    this._workloadMap = val;
  }

  private _advFilter = this.initAdvFilter();

  get advFilter() {
    return JSON.parse(JSON.stringify(this._advFilter));
  }

  set advFilter(val) {
    this._advFilter = val;
  }

  resetFilter() {
    this._advFilter = this.initAdvFilter();
    this.filteredSubject$.next(false);
  }

  filterFn(vul) {
    let result = true;
    if (this.advFilter.modified_dt) {
      result =
        result &&
        vul.last_modified_timestamp >=
          Math.floor(new Date(this.advFilter.modified_dt).getTime() / 1000);
    }
    if (this.advFilter.dt) {
      if (
        this.advFilter.publishedType &&
        this.advFilter.publishedType.id === 'before'
      )
        result =
          result &&
          vul.published_timestamp <=
            Math.floor(new Date(this.advFilter.dt).getTime() / 1000);
      else
        result =
          result &&
          vul.published_timestamp >=
            Math.floor(new Date(this.advFilter.dt).getTime() / 1000);
    }
    if (this.advFilter.severityType !== 'all') {
      result = result && vul.severity === this.advFilter.severityType;
    }
    if (this.advFilter.packageType === 'withFix') {
      let packagePairs = Object.entries(vul.packages);
      if (packagePairs.length) {
        const hasFix = packagePairs.find(
          ([key, val]: any) =>
            val.length && val.find(lib => !!lib.fixed_version)
        );
        result = result && !!hasFix;
      } else return false;
    }
    if (this.advFilter.packageType === 'withoutFix') {
      let packagePairs = Object.entries(vul.packages);
      if (packagePairs.length) {
        const hasFix = packagePairs.find(
          ([key, val]: any) =>
            val.length && val.find(lib => !!lib.fixed_version)
        );
        if (hasFix) return false;
      }
    }
    if (this.advFilter.containerName) {
      if (vul.workloads.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Container'].id,
          vul.workloads,
          this.advFilter.containerName,
          result
        );
      } else return false;
    }
    if (this.advFilter.nodeName) {
      if (vul.nodes.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Node'].id,
          vul.nodes,
          this.advFilter.nodeName,
          result
        );
      } else return false;
    }
    if (this.advFilter.imageName) {
      if (vul.images.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Image'].id,
          vul.images,
          this.advFilter.imageName,
          result
        );
      } else return false;
    }
    if (this.advFilter.selectedDomains.length) {
      result = this.checkEntity(
        this.advFilter.matchType4Ns.id,
        vul.domains,
        this.advFilter.selectedDomains.join(','),
        result
      );
    }
    if (this.advFilter.serviceName) {
      if (vul.workloads && Array.isArray(vul.workloads)) {
        result =
          result &&
          !!vul.workloads.find(workload => this.serviceFilter(workload));
      } else return false;
    }
    if (this.advFilter.sliderV2.minValue) {
      result = result && vul.score > this.advFilter.sliderV2.minValue;
    }
    if (this.advFilter.sliderV2.maxValue < 10) {
      result = result && vul.score < this.advFilter.sliderV2.maxValue;
    }
    if (this.advFilter.sliderV3.minValue) {
      result = result && vul.score_v3 > this.advFilter.sliderV3.minValue;
    }
    if (this.advFilter.sliderV3.maxValue < 10) {
      result = result && vul.score_v3 < this.advFilter.sliderV3.maxValue;
    }

    if (
      Array.isArray(this.advFilter.selectedDomains) &&
      this.advFilter.selectedDomains.length > 0
    ) {
      if (this.advFilter.matchType4Ns.id === 'contains') {
        let matchExp = new RegExp(this.advFilter.selectedDomains.join('|'));
        vul.filteredWorkloads = vul.workloads.filter(workload => {
          if (Array.isArray(workload.domains)) {
            return workload.domains.reduce((res, curr) => {
              return res || matchExp.test(curr);
            }, false);
          } else {
            return false;
          }
        });
        vul.filteredImages = vul.images.filter(image => {
          if (Array.isArray(image.domains)) {
            return image.domains.reduce((res, curr) => {
              return res || matchExp.test(curr);
            }, false);
          } else {
            return false;
          }
        });
      } else {
        vul.filteredWorkloads = vul.workloads.filter(workload => {
          if (Array.isArray(workload.domains)) {
            return workload.domains.reduce((res, curr) => {
              return res || this.advFilter.selectedDomains.includes(curr);
            }, false);
          } else {
            return false;
          }
        });
        vul.filteredImages = vul.images.filter(image => {
          if (Array.isArray(image.domains)) {
            return image.domains.reduce((res, curr) => {
              return res || this.advFilter.selectedDomains.includes(curr);
            }, false);
          } else {
            return false;
          }
        });
      }
    }
    return result;
  }

  checkEntity(matchType, entities, pattern, result) {
    const patterns = pattern.split(',').map(item => item.trim());
    const theEntity = entities.find(entity => {
      if (entity && entity.display_name) {
        if (matchType === 'equal')
          return patterns.some(item => item === entity.display_name);
        else return new RegExp(patterns.join('|')).test(entity.display_name);
      } else {
        if (matchType === 'equal')
          return patterns.some(item => item === entity);
        else return new RegExp(patterns.join('|')).test(entity);
      }
    });
    result = result && !!theEntity;
    return result;
  }

  namespaceFilter(workload) {
    if (this.advFilter.selectedDomains.length) {
      const container = this.workloadMap.get(workload.id);
      if (container && container.domain) {
        if (this.advFilter.matchType4Ns.id === 'contains')
          return new RegExp(this.advFilter.selectedDomains.join('|')).test(
            container.domain
          );
        else
          return this.advFilter.selectedDomains.some(
            item => container.domain === item
          );
      } else return false;
    } else return true;
  }

  serviceFilter(workload) {
    if (this.advFilter.serviceName) {
      const container = this.workloadMap.get(workload.id);
      if (container && container.service_group) {
        if (this.advFilter.matchTypes.Service.id === 'contains')
          return new RegExp(this.advFilter.serviceName).test(
            container.service_group.substring(3)
          );
        else
          return (
            this.advFilter.serviceName === container.service_group.substring(3)
          );
      } else return false;
    } else return true;
  }

  workloadFilter(workload) {
    if (this.advFilter.containerName) {
      const container = this.workloadMap.get(workload.id);
      if (container && container.display_name) {
        if (this.advFilter.matchTypes.Container.id === 'contains')
          return new RegExp(this.advFilter.containerName).test(
            container.display_name
          );
        else return this.advFilter.containerName === container.display_name;
      } else return false;
    } else return true;
  }

  initVulQuery(): VulnerabilityQuery {
    return MapConstant.INIT_VUL_ADV_FILTER as VulnerabilityQuery;
  }

  initAdvFilter() {
    return {
      packageType: 'all',
      severityType: 'all',
      scoreType: 'V3',
      publishedType: this.dateTypes[0],
      matchType: this.matchTypes[0],
      matchType4Ns: this.matchTypes[0],
      matchTypes: {
        Service: this.matchTypes[0],
        Image: this.matchTypes[0],
        Node: this.matchTypes[0],
        Container: this.matchTypes[0],
      },
      popup: { opened: false },
      dt: null,
      modified_dt: null,
      modified_dt_option: 'custom',
      entities: ['Service', 'Image', 'Node', 'Container'],
      entityType: 'Service',
      serviceName: '',
      imageName: '',
      nodeName: '',
      containerName: '',
      selectedDomains: [],
      sliderV2: { minValue: 0, maxValue: 10 },
      sliderV3: { minValue: 0, maxValue: 10 },
    };
  }

  filterView(
    vulnerabilites: VulnerabilityAsset[],
    selectedView: VulnerabilityView
  ): VulnerabilityAsset[] {
    switch (selectedView) {
      case 'all':
        return vulnerabilites;
      case 'containers':
        return vulnerabilites.filter(vul => vul.workloads.length);
      case 'infrastructure':
        return vulnerabilites.filter(
          vul => vul.nodes.length || vul.platforms.length
        );
      case 'registry':
        return vulnerabilites.filter(vul => vul.images.length);
    }
  }
}
