import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { EventItem } from '@common/types';
import { EventRow } from '@services/events.service';
import { BehaviorSubject } from 'rxjs';

export const FilterLevel = {
  error: 'Error',
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
  notice: 'Notice',
};

@Injectable()
export class EventsGridFilterService {
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

  filterFn(event: EventRow) {
    return (
      this._dateFilter(
        event.reported_timestamp,
        this.advFilter.reportedFrom
          ? new Date(this.advFilter.reportedFrom)
          : this.advFilter.reportedFrom,
        this.advFilter.reportedTo
          ? new Date(this.advFilter.reportedTo)
          : this.advFilter.reportedTo
      ) &&
      this._levelFilter(event.level, this.advFilter.level) &&
      this._nameFilter(event.name, this.advFilter.name) &&
      this._userNameFilter(event.user, this.advFilter.userName) &&
      this._nodeFilter(event.host_name, this.advFilter.host) &&
      this._containerFilter(event.workload_name, this.advFilter.container) &&
      this._imageFilter(event.workload_image, this.advFilter.image) &&
      this._domainFilter(
        event.workload_domain,
        this.advFilter.selectedDomains
      ) &&
      this._includeFilter(event, this.advFilter.includedKeyword) &&
      this._excludeFilter(event, this.advFilter.excludedKeyword)
    );
  }

  isAdvFilterOn() {
    return (
      this.advFilter.reportedFrom !== null ||
      this.advFilter.reportedTo !== null ||
      this.advFilter.level.length > 0 ||
      this.advFilter.name ||
      this.advFilter.userName ||
      this.advFilter.host ||
      this.advFilter.container ||
      this.advFilter.image ||
      this.advFilter.selectedDomains.length > 0 ||
      this.advFilter.includedKeyword ||
      this.advFilter.excludedKeyword
    );
  }

  initAdvFilter() {
    return {
      reportedFrom: null,
      reportedTo: null,
      level: [],
      name: '',
      userName: '',
      host: '',
      container: '',
      image: '',
      selectedDomains: [],
      includedKeyword: '',
      excludedKeyword: '',
    };
  }

  _dateFilter(
    reportedTimestamp: number,
    selectedFrom: Date | null,
    selectedTo: Date | null
  ) {
    if (selectedFrom && selectedTo) {
      return (
        reportedTimestamp <=
          Math.floor((selectedTo.getTime() + 24 * 60 * 60 * 1000) / 1000) &&
        reportedTimestamp >= Math.floor(selectedFrom.getTime() / 1000)
      );
    } else if (selectedFrom) {
      return reportedTimestamp >= Math.floor(selectedFrom.getTime() / 1000);
    } else if (selectedTo) {
      return (
        reportedTimestamp <=
        Math.floor((selectedTo.getTime() + 24 * 60 * 60 * 1000) / 1000)
      );
    } else {
      return true;
    }
  }

  _levelFilter(level: string, selectedLevels: string[]) {
    return selectedLevels.length > 0 ? selectedLevels.includes(level) : true;
  }

  _nameFilter(name: string, selectedName: string) {
    return selectedName
      ? name.toLowerCase() === selectedName.toLowerCase()
      : true;
  }

  _userNameFilter(userName: string, selectedUserName: string) {
    return selectedUserName
      ? userName.toLowerCase() === selectedUserName.toLowerCase()
      : true;
  }

  _nodeFilter(host: string, selectedHost: string) {
    return selectedHost ? host === selectedHost : true;
  }

  _containerFilter(container: string, selectedContainer: string) {
    return selectedContainer ? container === selectedContainer : true;
  }

  _imageFilter(image: string, selectedImage: string) {
    return selectedImage ? image === selectedImage : true;
  }

  _domainFilter(domain: string, selectedDomains: string[]) {
    return selectedDomains.length > 0 ? selectedDomains.includes(domain) : true;
  }

  _includeFilter(event: EventItem, keyword: string) {
    if (!keyword) return true;
    const _event = Object.assign({}, event);
    _event.reported_at = this.datePipe.transform(
      event.reported_at,
      'MMM dd, y HH:mm:ss'
    ) as string;
    return this.getValueString(_event)
      .toLowerCase()
      .includes(keyword.toLowerCase());
  }

  _excludeFilter(event: EventItem, keyword: string) {
    if (!keyword) return true;
    const _event = Object.assign({}, event);
    _event.reported_at = this.datePipe.transform(
      event.reported_at,
      'MMM dd, y HH:mm:ss'
    ) as string;
    return !this.getValueString(_event)
      .toLowerCase()
      .includes(keyword.toLowerCase());
  }

  getValueString(event: EventItem) {
    return Object.values(event)
      .map(value => {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        } else {
          return value;
        }
      })
      .join(',');
  }
}
