import { Injectable } from '@angular/core';
import { Compliance } from '@common/types';
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
  filteredCount: number = 0;

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
    this.filteredSubject$.next(this.isAdvFilterOn() || this._filtered);
  }

  resetFilter(filter?) {
    this._advFilter = filter ? filter : this.initAdvFilter();
    this.filteredSubject$.next(!!filter);
  }

  filterFn(compliance) {
    let result = true;
    if (
      !this.advFilter.category.custom ||
      !this.advFilter.category.docker ||
      !this.advFilter.category.kubernetes ||
      !this.advFilter.category.image
    ) {
      if (!this.advFilter.category.docker)
        result = result && compliance.category !== 'docker';
      if (!this.advFilter.category.custom)
        result = result && compliance.category !== 'custom';
      if (!this.advFilter.category.kubernetes)
        result = result && compliance.category !== 'kubernetes';
      if (!this.advFilter.category.image)
        result = result && compliance.category !== 'image';
    }
    if (
      this.advFilter.tags.gdpr ||
      this.advFilter.tags.hipaa ||
      this.advFilter.tags.nist ||
      this.advFilter.tags.pci
    ) {
      if (compliance.tags && compliance.tags.length > 0) {
        if (this.advFilter.tags.gdpr)
          result = result && compliance.tags.includes('GDPR');
        if (this.advFilter.tags.hipaa)
          result = result && compliance.tags.includes('HIPAA');
        if (this.advFilter.tags.nist)
          result = result && compliance.tags.includes('NIST');
        if (this.advFilter.tags.pci)
          result = result && compliance.tags.includes('PCI');
      } else return false;
    }
    if (this.advFilter.scoredType !== 'all') {
      result =
        result && compliance.scored.toString() === this.advFilter.scoredType;
    }
    if (this.advFilter.profileType !== 'all') {
      result = result && compliance.profile === this.advFilter.profileType;
    }
    if (this.advFilter.containerName) {
      if (compliance.workloads.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Container'].id,
          compliance.workloads,
          this.advFilter.containerName,
          result
        );
      } else return false;
    }
    if (this.advFilter.nodeName) {
      if (compliance.nodes.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Node'].id,
          compliance.nodes,
          this.advFilter.nodeName,
          result
        );
      } else return false;
    }
    if (this.advFilter.imageName) {
      if (compliance.images.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Image'].id,
          compliance.images,
          this.advFilter.imageName,
          result
        );
      } else return false;
    }
    if (this.advFilter.selectedDomains.length) {
      result = this.checkEntity(
        this.advFilter.matchType4Ns.id,
        compliance.domains,
        this.advFilter.selectedDomains.join(','),
        result
      );
    }
    if (this.advFilter.serviceName) {
      if (compliance.services && compliance.services.length) {
        result = this.checkEntity(
          this.advFilter.matchTypes['Service'].id,
          compliance.services,
          this.advFilter.serviceName,
          result
        );
      } else return false;
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
      const container = this.workloadMap.get(workload.id);
      if (container && container.domain) {
        if (advFilter.matchType4Ns.id === 'contains')
          return new RegExp(advFilter.selectedDomains.join('|')).test(
            container.domain
          );
        else
          return advFilter.selectedDomains.some(
            item => container.domain === item
          );
      } else return false;
    } else return true;
  }

  serviceFilter(workload) {
    const advFilter = this._advFilter;
    if (advFilter.serviceName) {
      const container = this.workloadMap.get(workload.id);
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
      const container = this.workloadMap.get(workload.id);
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
