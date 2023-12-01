import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { GridOptions } from 'ag-grid-community';
import { GlobalConstant } from '../constants/global.constant';
import { PathConstant } from '../constants/path.constant';
import { GlobalVariable } from '../variables/global.variable';
import { DatePipe } from '@angular/common';
import * as $ from 'jquery';
import {
  ChartDataUpdate,
  ComponentChartData,
  ContainerChartUpdate,
  isErrorResponse,
  SystemStatsData,
  Vulnerability,
  WorkloadCompliance,
} from '@common/types';
import { ChartConfiguration } from 'chart.js';
import { arrayToCsv, sortByOrder } from './common.utils';
import { saveAs } from 'file-saver';

@Injectable()
export class UtilsService {
  private topBar: number = 65;
  private sectionPadding: number = 20 * 2;
  private verticalPadding: number = 15 * 2;
  private header: number = 53;
  private title: number = 40;
  private marginInBoxes: number = 18;
  public CALENDAR: any = {
    YEARS: 'years',
    MONTHS: 'months',
    DAYS: 'days',
    HOURS: 'hours',
    MINUTES: 'minutes',
    SECONDS: 'seconds',
  };

  private $win;

  constructor(
    private translate: TranslateService,
    private http: HttpClient,
    private domSanitize: DomSanitizer,
    private datePipe: DatePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  convertHours(value: number): string {
    if (!value) return '';
    let HOURS = this.translate.instant('setting.HOURS');
    let DAYS = this.translate.instant('setting.DAYS');
    let d = Math.floor(value / 24);
    let h = Math.round(value % 24);
    let hours = h === 0 ? '' : `${h}${HOURS}`;
    if (h === 1) hours = hours.replace('s', '');
    let days = d === 0 ? '' : `${d}${DAYS}`;
    if (d === 1) days = days.replace('s', '');
    if (!d) return `${hours}`;
    return h > 0 ? `${days}, ${hours}` : `${days}`;
  }

  getI18Name(name) {
    return this.translate.instant('enum.' + name.toUpperCase());
  }

  keepAlive(success, error) {
    this.http.patch(PathConstant.KEEP_ALIVE_URL, null).subscribe(
      response => {
        success(response);
      },
      err => {
        console.warn(err);
        error(err);
      }
    );
  }

  getErrorMessage(err: HttpErrorResponse) {
    let contentType = err?.headers?.get?.('Content-Type');
    if (contentType) {
      if (contentType.includes('text/plain')) {
        return this.domSanitize.sanitize(SecurityContext.HTML, err.error);
      } else if (contentType.includes('application/json')) {
        return this.domSanitize.sanitize(
          SecurityContext.HTML,
          err.error.message
        );
      } else {
        return this.translate.instant('general.UNFORMATTED_ERR');
      }
    } else {
      return this.translate.instant('general.UNFORMATTED_ERR');
    }
  }

  private removeEndingChar(message: string): string {
    const ends = ['!', '.', '。'];
    let messageEndWith = (err, ends) => {
      return ends.some(element => {
        return err.endsWith(element);
      });
    };
    if (messageEndWith(message, ends)) message = message.replace(/.$/, '');
    return message;
  }

  getAlertifyMsg(error, errBrief, isHtml) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (isErrorResponse(error)) {
      message = error.message || error.error;
    } else if ('headers' in error) {
      message = this.getErrorMessage(error);
    } else {
      message = this.translate.instant('general.UNFORMATTED_ERR');
    }
    errBrief = this.removeEndingChar(errBrief);
    if (isHtml) {
      return (
        '<div class="server-error" style="padding: 0">' +
        '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
        '<div><span class="error-text">' +
        errBrief +
        ': ' +
        message.charAt(0).toUpperCase() +
        message.slice(1) +
        '</span></div></div>'
      );
    } else {
      return (
        errBrief + ': ' + message.charAt(0).toUpperCase() + message.slice(1)
      );
    }
  }

  getOverlayTemplateMsg(error) {
    let message = this.getErrorMessage(error);
    return (
      '<div class="server-error">' +
      '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
      '<div><span class="error-text">' +
      message +
      '</span></div></div>'
    );
  }

  getDateByInterval(base, interval, intervalUnit, pattern = 'yyyyMMddHHmmss') {
    //base format: "yyyymmddHHmmss"
    let resDateObj = moment([
      parseInt(base.substring(0, 4), 10),
      parseInt(base.substring(4, 6), 10) - 1,
      parseInt(base.substring(6, 8), 10),
      base.length > 8 ? parseInt(base.substring(8, 10)) : 0,
      base.length > 8 ? parseInt(base.substring(10, 12)) : 0,
      base.length > 8 ? parseInt(base.substring(12, 14)) : 0,
    ]).add(interval, intervalUnit);
    return this.datePipe.transform(resDateObj.toDate(), pattern);
  }

  parseDatetimeStr(datetimeObj, pattern?) {
    return this.datePipe.transform(
      datetimeObj,
      pattern ? pattern : 'yyyyMMddHHmmss'
    );
  }

  createGridOptions(columnDefs, win) {
    let option: GridOptions;
    option = {
      defaultColDef: {
        resizable: true,
        sortable: true,
      },
      headerHeight: 30,
      rowHeight: 30,
      suppressDragLeaveHidesColumns: true,
      columnDefs: columnDefs,
      rowData: null,
      animateRows: true,
      rowSelection: 'single',
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-down"></em>',
        sortDescending: '<em class="fa fa-sort-alpha-up"></em>',
      },
      onGridReady: params => {
        setTimeout(() => {
          params.api.sizeColumnsToFit();
        }, 300);
        win.on(GlobalConstant.AG_GRID_RESIZE, () => {
          setTimeout(() => {
            params.api.sizeColumnsToFit();
          }, 100);
        });
      },
      overlayNoRowsTemplate: `<span class="overlay">${this.translate.instant(
        'general.NO_ROWS'
      )}</span>`,
    };
    return option;
  }

  // createTreeGridOptions(columnDefs) {
  //   let option: GridOptions;
  //   option = this.createGridOptions(columnDefs);
  //   option.getNodeChildDetails = rowItem => {
  //     if (rowItem.children && rowItem.children.length > 0) {
  //       return {
  //         group: true,
  //         children: rowItem.children,
  //         expanded: rowItem.children.length > 0
  //       };
  //     } else {
  //       return null;
  //     }
  //   };
  //   return option;
  // }

  getMasterDetailHeight() {
    return (
      this.$win.innerHeight - this.topBar - this.sectionPadding - this.header
    );
  }

  getDetailViewHeight() {
    return (
      0.5 * this.getMasterDetailHeight() - this.verticalPadding - this.title
    );
  }

  getMasterGridHeight() {
    return (
      0.5 * this.getMasterDetailHeight() -
      this.verticalPadding -
      this.title -
      this.marginInBoxes
    );
  }

  makeWorkloadData(workload, isChild) {
    return {
      layer: isChild ? '      Children' : 'Parent',
      id: workload.id,
      display_name: workload.display_name,
      namespace: workload.domain,
      host_name: workload.host_name,
      image: workload.image,
      applications: workload.applications
        ? `'${workload.applications.join(', ')}'`
        : '',
      service_group: workload.service_group,
      network_mode: workload.network_mode,
      enforcer_id: workload.enforcer_id,
      privileged: workload.privileged,
      interfaces: workload.interfaces
        ? `'${Object.entries(workload.interfaces).map(([key, value]: any) => {
            //IP: ${value.ip}/${value.ip_prefix}, Gateway: ${value.gateway ? value.gateway : ""}
            return `${key} -> ${value
              .map(ipInfo => {
                return `IP: ${ipInfo.ip}/${ipInfo.ip_prefix}, Gateway: ${
                  ipInfo.gateway ? ipInfo.gateway : 'None'
                }`;
              })
              .join(', ')}`;
          })}'`
        : '',
      ports: workload.ports
        ? `'${workload.ports
            .map(port => {
              return `${port.host_ip}:${port.host_port} -> ${
                port.ip_proto === 6 ? 'TCP' : 'UDP'
              }/${port.port}`;
            })
            .join(', ')}'`
        : '',
      labels: workload.labels
        ? `'${Object.entries(workload.labels)
            .map(([key, value]) => {
              return `${key}: ${value}`;
            })
            .join(', ')}'`
        : '',
      vulnerability: workload.scan_summary
        ? `'Medium: ${workload.scan_summary.medium}, High: ${workload.scan_summary.high}'`
        : '',
      state: workload.state,
      started_at: `'${this.datePipe.transform(
        workload.started_at,
        'MMM dd, y HH:mm:ss'
      )}'`,
    };
  }

  makeWorkloadsCsvData(workloads) {
    let workloadsCsvData: any[] = [];
    workloads.forEach(workload => {
      workloadsCsvData.push(this.makeWorkloadData(workload, false));
      if (workload.children && workload.children.length > 0) {
        workload.children.forEach(workload => {
          workloadsCsvData.push(this.makeWorkloadData(workload, true));
        });
      }
    });
    return workloadsCsvData;
  }

  loadPagedData(url, params, arrayName, cb, handleError, options = {}) {
    this.http.get(url, { params: params }).subscribe(
      (res: any) => {
        let data = arrayName ? res[arrayName] : res;
        let length = arrayName ? res[arrayName].length : res.length;
        cb(data, options);
        if (length === params.limit) {
          params.start += params.limit;
          this.loadPagedData(url, params, arrayName, cb, options);
        }
      },
      e => {
        handleError(e);
      }
    );
  }

  loadPagedDataFinalize(
    url,
    params,
    arrayName,
    cb,
    handleError,
    finalize_cb,
    options = {}
  ) {
    this.http.get(url, { params: params }).subscribe(
      (res: any) => {
        let data = arrayName ? res[arrayName] : res;
        let length = arrayName ? res[arrayName].length : res.length;
        cb(data, options);
        if (length === params.limit) {
          params.start += params.limit;
          this.loadPagedData(url, params, arrayName, cb, options);
        } else {
          finalize_cb();
        }
      },
      e => {
        handleError(e);
        finalize_cb();
      }
    );
  }

  resetChart(
    chart: ChartConfiguration<'line', number[], string>,
    data: ComponentChartData
  ) {
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.y;
    chart.data.datasets[1].data = data.y1;
  }

  updateChart(
    chart: ChartConfiguration<'line', number[], string>,
    data: ChartDataUpdate
  ) {
    const labels = chart.data.labels,
      yData = chart.data.datasets[0].data,
      y1Data = chart.data.datasets[1].data;
    labels?.shift();
    yData.shift();
    y1Data.shift();
    const formattedLabel = this.datePipe.transform(data.read_at, 'HH:mm:ss');
    labels?.push(formattedLabel || '');
    yData.push(Number(data.data1));
    y1Data.push(Number(data.data2));
  }

  parseContainerStats(statsData: SystemStatsData): ContainerChartUpdate {
    const cpu: ChartDataUpdate = {
      data1: (statsData.stats.span_1.cpu * 100).toFixed(2),
      postfix1: '%',
      data2: (statsData.stats.span_1.memory / 1000 / 1000).toFixed(2),
      postfix2: 'MB',
      read_at: statsData.read_at,
    };
    const byte: ChartDataUpdate = {
      data1: (statsData.stats.span_1.byte_in / 1000).toFixed(2),
      postfix1: 'KB',
      data2: (statsData.stats.span_1.byte_out / 1000).toFixed(2),
      postfix2: 'KB',
      read_at: statsData.read_at,
    };
    const session: ChartDataUpdate = {
      data1: statsData.stats.total.cur_session_in
        ? statsData.stats.total.cur_session_in
        : 0,
      postfix1: '',
      data2: statsData.stats.total.cur_session_out
        ? statsData.stats.total.cur_session_out
        : 0,
      postfix2: '',
      read_at: statsData.read_at,
    };
    return {
      cpu,
      byte,
      session,
    };
  }

  parseControllerStats(statsData: SystemStatsData): ChartDataUpdate {
    return {
      data1: (statsData.stats.span_1.cpu * 100).toFixed(2),
      postfix1: '%',
      data2: (statsData.stats.span_1.memory / 1000 / 1000).toFixed(2),
      postfix2: 'MB',
      read_at: statsData.read_at,
    };
  }

  exportCVE(name: string, vuls: Vulnerability[]) {
    vuls = vuls.map(vulnerability => {
      vulnerability.in_base_image = vulnerability.in_base_image || false;
      vulnerability.description = `${vulnerability.description.replace(
        /\"/g,
        "'"
      )}`;
      vulnerability.tags = vulnerability.tags || ('' as any);
      return vulnerability;
    });
    const csv = arrayToCsv(sortByOrder(vuls, GlobalConstant.ORDERED_CVS_KEYS));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const filename = `vulnerabilities-${name}_${this.parseDatetimeStr(
      new Date()
    )}.csv`;
    saveAs(blob, filename);
  }

  getExportedFileName(response) {
    if (response.headers) {
      let filename = response.headers
        .get('Content-Disposition')
        .split('=')[1]
        .trim()
        .split('.');
      return `${filename[0]}_${this.parseDatetimeStr(new Date())}.${
        filename[1]
      }`;
    }
    return '';
  }

  getCisLabel(compliance: WorkloadCompliance) {
    if (
      compliance.kubernetes_cis_version.toLowerCase().includes('openshift-')
    ) {
      const version = compliance.kubernetes_cis_version.substring(10);
      return `OpenShift ${this.translate.instant(
        'containers.CIS_VERSION'
      )}: ${version}`;
    } else {
      return `Kubernetes ${this.translate.instant('containers.CIS_VERSION')}: ${
        compliance.kubernetes_cis_version
      }`;
    }
  }

  getGaugeMetrics(value: number): any {
    let gaugeLabel: string = '';
    let gaugeLabelColor: string = '';
    if (value <= GlobalConstant.SCORE_LEVEL.GOOD) {
      gaugeLabel = this.translate.instant(
        'dashboard.body.policy_evaluation.GOOD'
      );
      gaugeLabelColor = GlobalConstant.SCORE_COLOR.GOOD;
    } else if (value <= GlobalConstant.SCORE_LEVEL.FAIR) {
      gaugeLabel = this.translate.instant(
        'dashboard.body.policy_evaluation.FAIR'
      );
      gaugeLabelColor = GlobalConstant.SCORE_COLOR.FAIR;
    } else {
      gaugeLabel = this.translate.instant(
        'dashboard.body.policy_evaluation.POOR'
      );
      gaugeLabelColor = GlobalConstant.SCORE_COLOR.POOR;
    }
    return {
      gaugeLabel,
      gaugeLabelColor,
    };
  }

  getRelativeDuration(ts: moment.Moment) {
    let diff = ts.diff(moment());
    let huamnized = this.humanizeDuration(moment.duration(Math.abs(diff)), 1);
    return diff > 0
      ? this.translate.instant('time.relative.FUTURE', { time: huamnized })
      : this.translate.instant('time.relative.PAST', { time: huamnized });
  }

  humanizeDuration(duration: moment.Duration, precision: number = 2): string {
    let units: string[] = [];
    if (!duration || duration.toISOString() === 'P0D') return '';
    if (duration.years() >= 1) {
      const years = Math.floor(duration.years());
      units.push(
        years > 1
          ? this.translate.instant('time.YEARS', { time: years })
          : this.translate.instant('time.YEAR')
      );
    }
    if (duration.months() >= 1) {
      const months = Math.floor(duration.months());
      units.push(
        months > 1
          ? this.translate.instant('time.MONTHS', { time: months })
          : this.translate.instant('time.MONTH')
      );
    }
    if (duration.days() >= 1) {
      const days = Math.floor(duration.days());
      units.push(
        days > 1
          ? this.translate.instant('time.DAYS', { time: days })
          : this.translate.instant('time.DAY')
      );
    }
    if (duration.hours() >= 1) {
      const hours = Math.floor(duration.hours());
      units.push(
        hours > 1
          ? this.translate.instant('time.HOURS', { time: hours })
          : this.translate.instant('time.HOUR')
      );
    }
    if (duration.minutes() >= 1) {
      const minutes = Math.floor(duration.minutes());
      units.push(
        minutes > 1
          ? this.translate.instant('time.MINUTES', { time: minutes })
          : this.translate.instant('time.MINUTE')
      );
    }
    if (duration.seconds() >= 1) {
      const seconds = Math.floor(duration.seconds());
      units.push(
        seconds > 1
          ? this.translate.instant('time.SECONDS', { time: seconds })
          : this.translate.instant('time.SECOND')
      );
    }
    return units.slice(0, precision).join(', ');
  }
}
