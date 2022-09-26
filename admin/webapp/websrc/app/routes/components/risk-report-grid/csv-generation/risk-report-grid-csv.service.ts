import { Injectable } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { arrayToCsv } from '@common/utils/common.utils';
import { AuditRow } from '@services/risk-reports.service';
import { saveAs } from 'file-saver';

const CVE_URL = {
  UBUNTO: 'http://people.ubuntu.com/~ubuntu-security/cve/',
  DEBIAN: 'https://security-tracker.debian.org/tracker/',
  CENTOS_REDHAT: 'https://access.redhat.com/errata/',
  OTHER: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=',
};
const MAX_ITEMS = 9;

@Injectable()
export class RiskReportGridCsvService {
  constructor(private utils: UtilsService) {}

  exportCSV(reports4Csv): void {
    reports4Csv = JSON.parse(JSON.stringify(reports4Csv));
    reports4Csv = reports4Csv.map(audit => {
      this.auditRow2Item(audit);
      if (audit.items) {
        let count = audit.items.length;
        audit.items = audit.items.slice(0, MAX_ITEMS);
        audit.items = audit.items.map(
          item => `${item.replace(/\"/g, "'").replace(/\n/g, '')}`
        );
        if (count > 9) {
          audit.items.push(`......Total: ${count} items`);
        }
        audit.items = `${audit.items.join('\n')}`;
      } else {
        audit.items = '';
      }
      delete audit.high_vuls;
      delete audit.medium_vuls;
      return audit;
    });
    let csv = arrayToCsv(reports4Csv);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `Risk Reports_${this.utils.parseDatetimeStr(new Date())}.csv`);
  }

  exportBenchCSV(audit: AuditRow): void {
    let outputArray = [] as any;
    let reportCopy = JSON.parse(JSON.stringify(audit.items));
    reportCopy.forEach(bench => {
      outputArray.push({ compliance: bench.replace(/\"/g, "'") });
    });
    let csv = arrayToCsv(outputArray);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(
      blob,
      `${audit.name}${
        audit.base_os ? `-${audit.base_os}` : ''
      }-${audit.reported_at.replace(/\:|-|T|Z/g, '')}.csv`
    );
  }

  exportCVECSV(audit: AuditRow): void {
    let outputArray = [] as any;
    let reportCopy = JSON.parse(JSON.stringify(audit));
    if (reportCopy.high_vuls) {
      reportCopy.high_vuls.forEach(high_vul => {
        if (reportCopy.medium_vuls && reportCopy.medium_vuls.length > 0) {
          outputArray.push({
            high_vulnerability: `=HYPERLINK(""${this.getCveUrl(
              reportCopy.base_os,
              high_vul
            )}"", ""${high_vul}"")`,
            medium_vulnerability: `=HYPERLINK(""${this.getCveUrl(
              reportCopy.base_os,
              reportCopy.medium_vuls[0]
            )}"", ""${reportCopy.medium_vuls[0]}"")`,
          });
          reportCopy.medium_vuls.splice(0, 1);
        } else {
          outputArray.push({
            high_vulnerability: `=HYPERLINK(""${this.getCveUrl(
              reportCopy.base_os,
              high_vul
            )}"", ""${high_vul}"")`,
            medium_vulnerability: '',
          });
        }
      });
    }

    if (reportCopy.medium_vuls && reportCopy.medium_vuls.length > 0) {
      reportCopy.medium_vuls.map((_medium_vul, index) => {
        outputArray.push({
          high_vulnerability: '',
          medium_vulnerability: `=HYPERLINK(""${this.getCveUrl(
            reportCopy.base_os,
            reportCopy.medium_vuls[index]
          )}"", ""${reportCopy.medium_vuls[index]}"")`,
        });
      });
    }
    let csv = arrayToCsv(outputArray);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(
      blob,
      `${audit.name}${
        audit.base_os ? `-${audit.base_os}` : ''
      }-${audit.reported_at.replace(/\:|-|T|Z/g, '')}.csv`
    );
  }

  getCveUrl(baseOS: string, cveName: string) {
    let os = baseOS ? baseOS.toLowerCase() : '';
    if (os.indexOf('ubuntu') >= 0) {
      return `${CVE_URL.UBUNTO}${cveName}`;
    } else if (os.indexOf('debian') >= 0) {
      return `${CVE_URL.DEBIAN}${cveName}`;
    } else if (os.indexOf('centos') >= 0 || os.indexOf('rhel') >= 0) {
      return `${CVE_URL.CENTOS_REDHAT}${cveName}`;
    } else {
      return `${CVE_URL.OTHER}${cveName}`;
    }
  }

  private auditRow2Item(audit) {
    delete audit.id;
    delete audit.parent_id;
    delete audit.child_id;
    delete audit.visible;
  }
}
