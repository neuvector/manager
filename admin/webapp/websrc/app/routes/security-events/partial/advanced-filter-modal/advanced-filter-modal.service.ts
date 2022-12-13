import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { EventItem } from '@common/types';
import { BehaviorSubject } from 'rxjs';
import { capitalizeWord } from '@common/utils/common.utils';

export const FilterSeverity = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

export const FilterLocation = {
  host: 'Host',
  container: 'Container',
};

export const FilterCategory = {
  network: 'securityEvent.label.NETWORK',
  package: 'securityEvent.label.PACKAGE',
  file: 'securityEvent.label.FILE',
  tunnel: 'securityEvent.label.TUNNEL',
  process: 'securityEvent.label.PROCESS',
  priviledge: 'securityEvent.label.PRIVILEGE',
};

export const Other = {
  other: 'securityEvent.label.OTHER'
};

@Injectable()
export class AdvancedFilterModalService {
  private filteredSubject$ = new BehaviorSubject(false);
  filtered$ = this.filteredSubject$.asObservable();

  constructor(private datePipe: DatePipe) {}

  private _filtered = false;

  get filtered() {
    return this._filtered || this.isAdvFilterOn();
  }

  set filtered(val) {
    this._filtered = val;
    this.filteredSubject$.next(this.isAdvFilterOn() || this._filtered);
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

  filterFn(event: any) {
    return (
      this._severityFilter(event.details.level.name, this.advFilter.severity) &&
      this._locationFilter(event.details.labels, this.advFilter.location) &&
      this._categoryFilter(event.details.labels, this.advFilter.category) &&
      this._otherFilter(event.details.labels, this.advFilter.other) &&
      this._sourceFilter(event.endpoint.source.displayName, this.advFilter.source) &&
      this._destinationFilter(event.endpoint.destination.displayName, this.advFilter.destination) &&
      this._nodeFilter(event.host_name, this.advFilter.host) &&
      this._domainFilter(
        event.endpoint.source.domain,
        event.endpoint.destination.domain,
        this.advFilter.selectedDomains
      ) &&
      this._includeFilter(event, this.advFilter.includedKeyword) &&
      this._excludeFilter(event, this.advFilter.excludedKeyword)
    );
  }

  isAdvFilterOn() {
    return (
      this.advFilter.severity.length > 0 ||
      this.advFilter.location.length > 0 ||
      this.advFilter.category.length > 0 ||
      this.advFilter.other.length > 0 ||
      this.advFilter.source ||
      this.advFilter.destination ||
      this.advFilter.host ||
      this.advFilter.selectedDomains.length > 0 ||
      this.advFilter.includedKeyword ||
      this.advFilter.excludedKeyword
    );
  }

  initAdvFilter() {
    return {
      severity: [],
      location: [],
      category: [],
      other: [],
      source: '',
      destination: '',
      host: '',
      selectedDomains: [],
      includedKeyword: '',
      excludedKeyword: '',
    };
  }

  _severityFilter(severity: string, selectedSeverities: string[]) {
    return selectedSeverities.length > 0 ? selectedSeverities.includes(severity) : true;
  }

  _locationFilter(location: string[], selectedLocations: string[]) {
    let res = false;
    for (let selectedLocation of selectedLocations) {
      if (selectedLocation) {
        if (location.includes(selectedLocation.toLowerCase())) {
          res = true;
          break;
        }
      }
    }
    return selectedLocations.length > 0 ? res : true;
  }

  _categoryFilter(category: string[], selectedCategories: string[]) {
    let res = false;
    for (let selectedCategory of selectedCategories) {
      if (selectedCategory) {
        if (category.includes(selectedCategory.toLowerCase())) {
          res = true;
          break;
        }
      }
    }
    return selectedCategories.length > 0 ? res : true;
  }

  _otherFilter(other: string[], selectedOther: string[]) {
    return selectedOther[0] ? other.length === 0 : true;
  }

  _sourceFilter(source: string, selectedSource: string) {
    return selectedSource ? source === selectedSource : true;
  }

  _destinationFilter(destination: string, selectedDestination: string) {
    return selectedDestination ? destination === selectedDestination : true;
  }

  _nodeFilter(host: string, selectedHost: string) {
    return selectedHost ? host === selectedHost : true;
  }

  _domainFilter(sourceDomain: string, destinationDomain: string, selectedDomains: string[]) {
    return selectedDomains.length > 0 ? selectedDomains.includes(sourceDomain) || selectedDomains.includes(destinationDomain) : true;
  }

  _includeFilter(event: any, keyword: string) {
    if (!keyword) return true;
    const _event = Object.assign({}, event);
    _event.reported_at = this.datePipe.transform(
      event.reported_at,
      'MMM dd, y HH:mm:ss'
    ) as string;
    return this.getValueString(_event).includes(keyword.toLowerCase());
  }

  _excludeFilter(event: any, keyword: string) {
    if (!keyword) return true;
    const _event = Object.assign({}, event);
    _event.reported_at = this.datePipe.transform(
      event.reported_at,
      'MMM dd, y HH:mm:ss'
    ) as string;
    return !this.getValueString(_event).includes(keyword.toLowerCase());
  }

  getValueString(event: any) {
    return Object.values(event)
      .map((value: any) => {
        if (typeof value === 'object' && !!value) {
          return this.getValueString(value);
        } else if (typeof value === 'string' || typeof value === 'number') {
          return value.toString().toLowerCase();
        } else {
          return value;
        }
      })
      .join(',');
  }
}
