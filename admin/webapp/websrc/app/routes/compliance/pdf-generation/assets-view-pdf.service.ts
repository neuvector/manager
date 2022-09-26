import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { BehaviorSubject } from 'rxjs';
import { MapConstant } from '@common/constants/map.constant';
import { i18nPdfTranslateService } from './i18n-pdf-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { assetsViewPdfJob } from './assets-view-pdf-job';
import { ComplianceFilterService } from '../compliance.filter.service';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

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
    private complianceFilterService: ComplianceFilterService
  ) {}

  private _masterData;

  set masterData(val) {
    this._masterData = val;
  }

  runWorker() {
    this.progressSubject$.next(0);
    const complianceList = this.complianceFilterService.filteredCis;
    const isFiltered = this.complianceFilterService.filtered;
    const advFilter = this.complianceFilterService.advFilter;
    const masterData = this._masterData;
    this.pdf = null;
    if (this.worker) {
      this.worker.terminate();
      console.info('killed an existing running worker2...');
    }
    this.createWorker();
    if (this.worker) {
      const docDefinition = Object.assign(
        {},
        {
          data: {
            masterData,
            complianceList,
            isFiltered,
            advFilter,
          },
        },
        { images: MapConstant.imageMap },
        {
          metadata: this.i18nPdfTranslateService.getI18NMessages({
            filteredCount: complianceList.length,
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
          'cis.report.TITLE2'
        )}_${this.utilsService.parseDatetimeStr(new Date())}.pdf`
      );
    });
  }

  downloadPdf() {
    if (this.pdf && this.worker) {
      console.log(this.translateService.instant('cis.report.TITLE2'));
      saveAs(
        this.pdf,
        `${this.translateService.instant(
          'cis.report.TITLE2'
        )}_${this.utilsService.parseDatetimeStr(new Date())}.pdf`
      );
    } else {
      const complianceList = this.complianceFilterService.filteredCis;
      const isFiltered = this.complianceFilterService.filtered;
      const advFilter = this.complianceFilterService.advFilter;
      const masterData = this._masterData;
      let docData = Object.assign(
        {},
        {
          data: {
            masterData,
            complianceList,
            isFiltered,
            advFilter,
          },
        },
        { images: MapConstant.imageMap },
        {
          metadata: this.i18nPdfTranslateService.getI18NMessages({
            filteredCount: complianceList.length,
          }),
        }
      );
      const docDefinition = assetsViewPdfJob()(docData);
      this.drawReport(docDefinition);
    }
  }
}
