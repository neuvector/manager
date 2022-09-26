import { Injectable } from '@angular/core';

export type VersionInfoType = 'compliance' | 'vulnerabilities' | '';

@Injectable()
export class VersionInfoService {
  private _infoData: any;
  template!: VersionInfoType;
  get infoData() {
    return this._infoData;
  }

  constructor() {}

  setVersionInfo(data: any, template: VersionInfoType) {
    this._infoData = data;
    this.template = template;
  }

  isTemplate(type: VersionInfoType) {
    return type === this.template;
  }
}
