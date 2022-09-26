import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class VulnerabilitiesFilterService {
  readonly matchTypes = [
    { id: 'equal', name: '=' },
    {
      id: 'contains',
      name: this.translate.instant('admissionControl.operators.CONTAINS'),
    },
  ];

  readonly dateTypes = [
    { id: 'before', name: this.translate.instant('general.BEFORE') },
    { id: 'after', name: this.translate.instant('general.AFTER') },
  ];
  private filteredSubject$ = new BehaviorSubject(false);
  filtered$ = this.filteredSubject$.asObservable();

  constructor(private translate: TranslateService) {}

  private _filtered = false;

  get filtered() {
    return this._filtered || this.isAdvFilterOn();
  }

  set filtered(val) {
    this._filtered = val;
    this.filteredSubject$.next(this.isAdvFilterOn() || this._filtered);
  }

  private _filteredCis;

  get filteredCis() {
    return JSON.parse(JSON.stringify(this._filteredCis));
  }

  set filteredCis(val) {
    this._filteredCis = val;
  }

  private _workloadMap;

  set workloadMap(val) {
    this._workloadMap = val;
  }

  private _advFilter = this.initAdvFilter();

  get advFilter() {
    return JSON.parse(JSON.stringify(this._advFilter));
  }

  set advFilter(val) {
    this._advFilter = val;
    this.filteredSubject$.next(this.isAdvFilterOn() || this._filtered);
  }

  resetFilter() {
    this._advFilter = this.initAdvFilter();
    this.filteredSubject$.next(false);
  }

  isAdvFilterOn() {
    return (
      this.advFilter.dt !== null ||
      this.advFilter.packageType !== 'all' ||
      this.advFilter.severityType !== 'all' ||
      this.advFilter.selectedDomains.length > 0 ||
      this.advFilter.serviceName ||
      this.advFilter.imageName ||
      this.advFilter.nodeName ||
      this.advFilter.containerName ||
      this.advFilter.sliderV2.minValue > 0 ||
      this.advFilter.sliderV2.maxValue < 10 ||
      this.advFilter.sliderV3.minValue > 0 ||
      this.advFilter.sliderV3.maxValue < 10
    );
  }

  namespaceFilter(workload) {
    if (this.advFilter.selectedDomains.length) {
      const container = this.workloadMap.get(workload.id);
      const nsNames = this.advFilter.selectedDomains.map(
        selectedDomain => selectedDomain.name
      );
      if (container && container.domain) {
        if (this.advFilter.matchType4Ns.id === 'contains')
          return new RegExp(nsNames.join('|')).test(container.domain);
        else return nsNames.some(item => container.domain === item);
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
}
