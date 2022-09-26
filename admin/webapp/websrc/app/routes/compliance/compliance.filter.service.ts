import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ComplianceFilterService {
  readonly matchTypes = [
    { id: 'equal', name: '=' },
    {
      id: 'contains',
      name: this.translate.instant('admissionControl.operators.CONTAINS'),
    },
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
      this._advFilter.scoredType !== 'all' ||
      this._advFilter.profileType !== 'all' ||
      !this._advFilter.category.custom ||
      !this._advFilter.category.docker ||
      !this._advFilter.category.kubernetes ||
      !this._advFilter.category.image ||
      this._advFilter.tags.gdpr ||
      this._advFilter.tags.hipaa ||
      this._advFilter.tags.nist ||
      this._advFilter.tags.pci ||
      this._advFilter.selectedDomains.length > 0 ||
      !!this._advFilter.serviceName ||
      !!this._advFilter.imageName ||
      !!this._advFilter.nodeName ||
      !!this._advFilter.containerName
    );
  }

  namespaceFilter(workload) {
    const advFilter = this._advFilter;
    if (advFilter.selectedDomains.length) {
      const container = this._workloadMap.get(workload.id);
      const nsNames = advFilter.selectedDomains.map(
        (selectedDomain: any) => selectedDomain.name
      );
      if (container && container.domain) {
        if (advFilter.matchType4Ns.id === 'contains')
          return new RegExp(nsNames.join('|')).test(container.domain);
        else return nsNames.some(item => container.domain === item);
      } else return false;
    } else return true;
  }

  serviceFilter(workload) {
    const advFilter = this._advFilter;
    if (advFilter.serviceName) {
      const container = this._workloadMap.get(workload.id);
      if (container && container.service_group) {
        if (advFilter.matchTypes.Service.id === 'contains')
          return new RegExp(advFilter.serviceName).test(
            container.service_group.substring(3)
          );
        else
          return advFilter.serviceName === container.service_group.substring(3);
      } else return false;
    } else return true;
  }

  workloadFilter(workload) {
    const advFilter = this._advFilter;
    if (advFilter.containerName) {
      const container = this._workloadMap.get(workload.id);
      if (container && container.display_name) {
        if (advFilter.matchTypes.Container.id === 'contains')
          return new RegExp(advFilter.containerName).test(
            container.display_name
          );
        else return advFilter.containerName === container.display_name;
      } else return false;
    } else return true;
  }

  initAdvFilter() {
    return {
      category: {
        docker: true,
        kubernetes: true,
        custom: true,
        image: true,
      },
      tags: {
        gdpr: false,
        hipaa: false,
        nist: false,
        pci: false,
      },
      scoredType: 'all',
      profileType: 'all',
      matchType4Ns: this.matchTypes[0],
      matchTypes: {
        Service: this.matchTypes[0],
        Image: this.matchTypes[0],
        Node: this.matchTypes[0],
        Container: this.matchTypes[0],
      },
      selectedDomains: [],
      serviceName: '',
      imageName: '',
      nodeName: '',
      containerName: '',
    };
  }
}
