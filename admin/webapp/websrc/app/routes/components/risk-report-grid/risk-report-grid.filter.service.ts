import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Audit } from '@common/types';
import { AuditRow } from '@services/risk-reports.service';
import { BehaviorSubject } from 'rxjs';

export const FilterLevel = {
  error: 'Error',
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

export const FilterCategory = {
  compliance: 'Compliance',
  admission: 'Admission',
};

@Injectable()
export class RiskReportGridFilterService {
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

  filterFn(audit: AuditRow) {
    return (
      this._dateFilter(
        audit.reported_timestamp,
        this.advFilter.reportedFrom
          ? new Date(this.advFilter.reportedFrom)
          : this.advFilter.reportedFrom,
        this.advFilter.reportedTo
          ? new Date(this.advFilter.reportedTo)
          : this.advFilter.reportedTo
      ) &&
      this._levelFilter(audit.level, this.advFilter.level) &&
      this._categoryFilter(audit.name, this.advFilter.category) &&
      this._nodeFilter(audit.host_name, this.advFilter.host) &&
      (audit.workload_name
        ? this._containerFilter(audit.workload_name, this.advFilter.container)
        : true) &&
      (audit.workload_image
        ? this._imageFilter(audit.workload_image, this.advFilter.image)
        : true) &&
      (audit.workload_domain
        ? this._domainFilter(
            audit.workload_domain,
            this.advFilter.selectedDomains
          )
        : true) &&
      this._includeFilter(audit, this.advFilter.includedKeyword) &&
      this._excludeFilter(audit, this.advFilter.excludedKeyword)
    );
  }

  isAdvFilterOn() {
    return (
      this.advFilter.reportedFrom !== null ||
      this.advFilter.reportedTo !== null ||
      this.advFilter.level.length > 0 ||
      this.advFilter.category.length > 0 ||
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
      category: [],
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

  _categoryFilter(name: string, selectedCategories: string[]) {
    return selectedCategories.length > 0
      ? selectedCategories.some(c =>
          name.toLowerCase().includes(c.toLowerCase())
        )
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

  _includeFilter(audit: Audit, keyword: string) {
    if (!keyword) return true;
    const _audit = Object.assign({}, audit);
    _audit.reported_at = this.datePipe.transform(
      audit.reported_at,
      'MMM dd, y HH:mm:ss'
    ) as string;
    return this.getValueString(_audit)
      .toLowerCase()
      .includes(keyword.toLowerCase());
  }

  _excludeFilter(audit: Audit, keyword: string) {
    if (!keyword) return true;
    const _audit = Object.assign({}, audit);
    _audit.reported_at = this.datePipe.transform(
      audit.reported_at,
      'MMM dd, y HH:mm:ss'
    ) as string;
    return !this.getValueString(_audit)
      .toLowerCase()
      .includes(keyword.toLowerCase());
  }

  getValueString(audit: Audit) {
    return Object.values(audit)
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
