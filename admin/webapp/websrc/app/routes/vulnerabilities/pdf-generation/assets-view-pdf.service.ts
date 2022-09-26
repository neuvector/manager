import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { saveAs } from 'file-saver';
import { assetsViewPdfJob } from '../../compliance/pdf-generation/assets-view-pdf-job';
import { i18nPdfTranslateService } from './i18n-pdf-transalte.service';
import { DatePipe } from '@angular/common';
import { VulnerabilitiesFilterService } from '../vulnerabilities.filter.service';

@Injectable()
export class AssetsViewPdfService {
  private pdf;
  private worker;
  private progressSubject$ = new BehaviorSubject<number>(0);
  progress$ = this.progressSubject$.asObservable();

  constructor(
    private i18nPdfTranslateService: i18nPdfTranslateService,
    private translateService: TranslateService,
    private utilsService: UtilsService,
    private vulnerabilitiesFilterService: VulnerabilitiesFilterService,
    private datePipe: DatePipe
  ) {}

  private _masterData;

  set masterData(val) {
    console.log('MASTER', val);
    this._masterData = val;
  }

  runWorker() {
    console.log('running');
    this.progressSubject$.next(0);
    const vulnerabilities = this.vulnerabilitiesFilterService.filteredCis;
    const isFiltered = this.vulnerabilitiesFilterService.filtered;
    const advFilter = this.vulnerabilitiesFilterService.advFilter;
    const masterData = this._masterData;
    this.pdf = null;
    if (this.worker) {
      this.worker.terminate();
      console.info('killed an existing running worker2...');
    }
    this.createWorker();
    if (this.worker) {
      console.log('Worker Exists');
      const docDefinition = Object.assign(
        {},
        {
          data: {
            masterData: masterData,
            vulnerabilities: vulnerabilities.map(vul => {
              vul.published_datetime = this.datePipe.transform(
                vul.published_timestamp * 1000,
                'MMM dd, y HH:mm:ss'
              );
              return vul;
            }),
            isFiltered: isFiltered,
            advFilter: advFilter,
          },
        },
        { images: MapConstant.imageMap }, //Picture URI code which is used in PDF
        {
          metadata: this.i18nPdfTranslateService.getI18NMessages({
            filteredCount: vulnerabilities.length,
          }),
        }
      );
      console.log('Post message to worker2...');
      this.worker.onmessage = ({ data }) => {
        this.progressSubject$.next(Math.floor(data.progress * 100));
        this.pdf = data.blob;
      };
      this.worker.postMessage(JSON.stringify(docDefinition));
    } else {
      this.progressSubject$.next(100);
    }
  }

  createWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./assets-view-pdf.worker.ts', import.meta.url)
      );
    }
  }

  drawReport(docDefinition) {
    let report = pdfMake.createPdf(docDefinition);
    report.getBlob(blob => {
      saveAs(
        blob,
        `${this.translateService.instant(
          'scan.report.TITLE2'
        )}_${this.utilsService.parseDatetimeStr(new Date())}.pdf`
      );
    });
  }

  downloadPdf() {
    if (this.pdf && this.worker) {
      console.log(this.translateService.instant('scan.report.TITLE2'));
      saveAs(
        this.pdf,
        `${this.translateService.instant(
          'scan.report.TITLE2'
        )}_${this.utilsService.parseDatetimeStr(new Date())}.pdf`
      );
    } else {
      const vulnerabilities = this.vulnerabilitiesFilterService.filteredCis;
      const isFiltered = this.vulnerabilitiesFilterService.filtered;
      const advFilter = this.vulnerabilitiesFilterService.advFilter;
      const masterData = this._masterData;
      let docData = Object.assign(
        {},
        {
          data: {
            masterData: masterData,
            vulnerabilities: this.vulnerabilitiesFilterService.filteredCis.map(
              vul => {
                vul.published_datetime = this.datePipe.transform(
                  vul.published_timestamp * 1000,
                  'MMM dd, y HH:mm:ss'
                );
                return vul;
              }
            ),
            isFiltered,
            advFilter,
          },
        },
        { images: MapConstant.imageMap }, //Picture URI code which is used in PDF
        {
          metadata: this.i18nPdfTranslateService.getI18NMessages({
            filteredCount: vulnerabilities.length,
          }),
        }
      );
      const docDefinition = assetsViewPdfJob()(docData);
      this.drawReport(docDefinition);
    }
  }
}
