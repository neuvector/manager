import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Module, Vulnerability } from '@common/types';
import { saveAs } from 'file-saver';
import { cloneDeep } from 'lodash';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { groupBy, arrayToCsv } from '@common/utils/common.utils';

const CVE_ST = {
  FIXABLE: 'fix exists',
  UNPATCHED: 'unpatched',
  WILL_NOT_FIX: 'will not fix',
  UNAFFECTED: 'unaffected',
};

@Component({
  standalone: false,
  selector: 'app-registry-modules',
  templateUrl: './registry-modules.component.html',
  styleUrls: ['./registry-modules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryModulesComponent {
  @Input() path!: string;
  @Input() repository!: string;
  @Input() imageId!: string;
  @Input() baseOS!: string;
  @Input() modules!: Module[];
  @Input() vulnerabilities!: Vulnerability[];
  @Input() resize!: boolean;
  hideSafeModules = true;
  cves = [];

  constructor(
    private utilsService: UtilsService,
    private translateService: TranslateService
  ) {}

  moduleSelected(data): void {
    this.cves = data.cves ? data.cves : [];
  }

  onToggleSafeModules(): void {
    this.hideSafeModules = !this.hideSafeModules;
  }

  exportCSV(): void {
    let module4Csv: any = cloneDeep(this.modules);
    const title = `${this.path + this.repository} | Image Id: ${
      this.imageId
    } | OS: ${this.baseOS}`;
    const vulMap = groupBy(this.vulnerabilities, 'name');
    module4Csv = module4Csv.map(module => {
      return {
        name: module.name,
        source: module.source,
        version: module.version,
        count_of_vulnerabilies: module.cves
          ? this.translateService.instant('registry.gridHeader.FIXABLE') +
            ': ' +
            module.cves.filter(
              cve => cve.status.toLowerCase() === CVE_ST.FIXABLE.toLowerCase()
            ).length +
            '/' +
            this.translateService.instant('registry.gridHeader.TOTAL') +
            ': ' +
            module.cves.length
          : '',
        vulnerabilites: module.cves
          ? `'${module.cves
              .map(cve => {
                if (vulMap[cve.name]) {
                  const fixed_version = vulMap[cve.name][0].fixed_version;
                  return `${cve.name}(${cve.status}${
                    fixed_version.length > 0 ? `-${fixed_version}` : ''
                  })`;
                } else {
                  return `${cve.name}(${cve.status})`;
                }
              })
              .join(', ')}'`
          : '',
      };
    });
    const modules = arrayToCsv(module4Csv, title);
    const blob = new Blob([modules], { type: 'text/csv;charset=utf-8' });
    const filename = `modules-${
      this.path + this.repository
    }_${this.utilsService.parseDatetimeStr(new Date())}.csv`;
    saveAs(blob, filename);
  }
}
