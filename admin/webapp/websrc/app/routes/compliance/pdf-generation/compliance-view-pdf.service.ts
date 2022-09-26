import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { i18nPdfTranslateService } from './i18n-pdf-translate.service';
import { ComplianceFilterService } from '../compliance.filter.service';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Injectable()
export class ComplianceViewPdfService {
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

  runWorker() {
    this.progressSubject$.next(0);
    const complianceList = this.complianceFilterService.filteredCis;
    this.pdf = null;
    if (this.worker) {
      this.worker.terminate();
      console.info('killed an existing running worker...');
    }
    this.createWorker();
    if (this.worker) {
      if (complianceList) {
        let complianceList4Pdf = complianceList.map(compliance => {
          compliance.workloads = compliance.workloads.filter(workload =>
            this.complianceFilterService.namespaceFilter(workload)
          );
          return compliance;
        });
        let docData = Object.assign(
          {},
          {
            data:
              complianceList4Pdf.length >= MapConstant.REPORT_TABLE_ROW_LIMIT
                ? complianceList4Pdf.slice(
                    0,
                    MapConstant.REPORT_TABLE_ROW_LIMIT
                  )
                : complianceList4Pdf,
          },
          {
            metadata: this.i18nPdfTranslateService.getI18NMessages({
              filteredCount: complianceList.length,
            }),
          },
          { images: MapConstant.imageMap },
          { charts: this.getChartsForPDF() },
          { rowLimit: MapConstant.REPORT_TABLE_ROW_LIMIT }
        );
        console.log('Post message to worker...');
        this.worker.postMessage(JSON.stringify(this._formatContent(docData)));
      } else {
        console.warn('no data in audit.');
      }
      this.worker.onmessage = event => {
        this.pdf = event.data.blob;
        this.progressSubject$.next(Math.floor(event.data.progress * 100));
      };
    } else {
      this.progressSubject$.next(100);
    }
  }

  createWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./compliance-view-pdf.worker.ts', import.meta.url)
      );
    }
  }

  downloadPdf() {
    const complianceList = this.complianceFilterService.filteredCis;
    if (this.worker && this.pdf) {
      saveAs(
        this.pdf,
        `${this.translateService.instant(
          'cis.report.TITLE'
        )}${this.getRegulationTitlePostfix()}_${this.utilsService.parseDatetimeStr(
          new Date()
        )}.pdf`
      );
    } else {
      let complianceList4Pdf = complianceList.map(compliance => {
        compliance.workloads = compliance.workloads.filter(workload =>
          this.complianceFilterService.namespaceFilter(workload)
        );
        return compliance;
      });
      let docData = Object.assign(
        {},
        {
          data:
            complianceList4Pdf.length >= MapConstant.REPORT_TABLE_ROW_LIMIT
              ? complianceList4Pdf.slice(0, MapConstant.REPORT_TABLE_ROW_LIMIT)
              : complianceList4Pdf,
        },
        {
          metadata: this.i18nPdfTranslateService.getI18NMessages({
            filteredCount: complianceList.length,
          }),
        },
        { images: MapConstant.imageMap },
        { charts: this.getChartsForPDF() },
        { rowLimit: MapConstant.REPORT_TABLE_ROW_LIMIT }
      );
      let docDefinition = this._formatContent(docData);
      this.drawReport(docDefinition);
    }
  }

  private prepareNamesWith3Columns = function (names, type) {
    let namesMatrix: any = [];
    let rowData: any = [];
    for (let i = 0; i < names.length; i++) {
      if (i % 3 === 0) {
        if (Math.floor(i / 3) > 0)
          namesMatrix.push({ columns: JSON.parse(JSON.stringify(rowData)) });
        rowData = [{ text: '' }, { text: '' }, { text: '' }];
      }
      rowData[i % 3] = {
        text: names[i].display_name,
        color: MapConstant.PDF_TEXT_COLOR[type.toUpperCase()],
        style: 'appendixText',
      };
    }
    namesMatrix.push({ columns: JSON.parse(JSON.stringify(rowData)) });
    return namesMatrix;
  };

  private prepareAppendix(docData) {
    let appendix: any[] = [];
    console.log('docData.data: ', docData.data);
    docData.data.forEach(item => {
      let cve = {
        text: item.name,
        style: 'appendixTitle',
      };
      let image = {
        text: `${docData.metadata.data.images}: ${item.images.length}`,
        color: MapConstant.PDF_TEXT_COLOR.IMAGE,
        style: 'appendixTitle',
      };
      let imageList = this.prepareNamesWith3Columns(item.images, 'image');
      let container = {
        text: `${docData.metadata.data.containers}: ${item.workloads.length}`,
        color: MapConstant.PDF_TEXT_COLOR.CONTAINER,
        style: 'appendixTitle',
      };
      let containerList = this.prepareNamesWith3Columns(
        item.workloads,
        'container'
      );
      let node = {
        text: `${docData.metadata.data.nodes}: ${item.nodes.length}`,
        color: MapConstant.PDF_TEXT_COLOR.NODE,
        style: 'appendixTitle',
      };
      let nodeList = this.prepareNamesWith3Columns(item.nodes, 'node');
      let platform = {
        text: `${docData.metadata.data.platforms}: ${item.platforms.length}`,
        color: MapConstant.PDF_TEXT_COLOR.PLATFORM,
        style: 'appendixTitle',
      };
      let platformList = this.prepareNamesWith3Columns(
        item.platforms,
        'platform'
      );
      let lineBreak = {
        text: '\n\n',
      };
      appendix.push(cve);
      if (item.images.length > 0) {
        appendix.push(image);
        appendix = appendix.concat(imageList);
      }
      if (item.workloads.length > 0) {
        appendix.push(container);
        appendix = appendix.concat(containerList);
      }
      if (item.nodes.length > 0) {
        appendix.push(node);
        appendix = appendix.concat(nodeList);
      }
      if (item.platforms.length > 0) {
        appendix.push(platform);
        appendix = appendix.concat(platformList);
      }
      appendix.push(lineBreak);
    });
    console.log('appendix: ', appendix);
    return appendix;
  }

  private _getRowData(item, id, metadata) {
    let category = item.category;
    let name = item.name;
    let description = item.description;
    let level = this._getLevelInfo(item);
    let scored = item.scored;
    let profile = item.profile;
    let impact = this._getImpact(item, metadata);
    let remediation = item.remediation ? item.remediation : 'N/A';
    return [
      category,
      name,
      description,
      level,
      scored,
      profile,
      impact,
      remediation,
    ];
  }

  private _getLevelInfo(item) {
    let level: any = {};
    level.text = item.level;
    level.style = item.level.toLowerCase();

    return level;
  }

  private _getImpact(item, metadata) {
    let impactList: any = [];
    let imageList: any = {};
    imageList.ul = [];
    let nodeList: any = {};
    nodeList.ul = [];
    let containerList: any = {};
    containerList.ul = [];
    if (item.images && item.images.length > 0) {
      imageList.ul = item.images.map(image => image.display_name);
      impactList.push({ text: `${metadata.data.images}`, bold: true });
      if (imageList.ul.length > 5) {
        let omitedList = imageList.ul.slice(0, 5);
        omitedList.push(`......(${imageList.ul.length} images)`);
        impactList.push({ ul: omitedList });
      } else {
        impactList.push(imageList);
      }
    }
    if (item.nodes && item.nodes.length > 0) {
      nodeList.ul = item.nodes.map(node => node.display_name);
      impactList.push({ text: `${metadata.data.nodes}`, bold: true });
      if (nodeList.ul.length > 5) {
        let omitedList = nodeList.ul.slice(0, 5);
        omitedList.push(`......(${nodeList.ul.length} nodes)`);
        impactList.push({ ul: omitedList });
      } else {
        impactList.push(nodeList);
      }
    }
    if (item.workloads && item.workloads.length > 0) {
      containerList.ul = item.workloads.map(workload => workload.display_name);
      impactList.push({ text: `${metadata.data.containers}`, bold: true });
      if (containerList.ul.length > 5) {
        let omitedList = containerList.ul.slice(0, 5);
        omitedList.push(`......(${containerList.ul.length} containers)`);
        impactList.push({ ul: omitedList });
      } else {
        impactList.push(containerList);
      }
    }
    return impactList;
  }

  private _formatContent = docData => {
    let metadata = docData.metadata;
    let images = docData.images;
    let charts = docData.charts;

    let docDefinition: any = {
      info: {
        title: metadata.title,
        author: 'NeuVector',
        subject: 'Compliance report',
        keywords: 'Compliance report',
      },
      headerData: {
        text: metadata.others.headerText,
        alignment: 'center',
        italics: true,
        style: 'pageHeader',
      },
      footerData: {
        line: {
          image: images.FOOTER_LINE,
          width: 650,
          height: 1,
          margin: [50, 5, 0, 10],
        },
        text: metadata.others.footerText,
      },
      header: currentPage => {
        if (currentPage === 2 || currentPage === 3) {
          return {
            text: metadata.others.headerText,
            alignment: 'center',
            italics: true,
            style: 'pageHeader',
          };
        } else {
          return {};
        }
      },
      footer: currentPage => {
        if (currentPage > 1) {
          return {
            stack: [
              {
                image: images.FOOTER_LINE,
                width: 650,
                height: 1,
                margin: [50, 5, 0, 10],
              },
              {
                text: [
                  { text: metadata.others.footerText, italics: true },
                  { text: ' |   ' + currentPage },
                ],
                alignment: 'right',
                style: 'pageFooter',
              },
            ],
          };
        } else {
          return {};
        }
      },
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [50, 50, 50, 45],
      defaultStyle: {
        fontSize: 7,
        columnGap: 10,
      },
      content: [
        {
          image: images.BACKGROUND,
          width: 1000,
          absolutePosition: { x: 0, y: 300 },
        },
        {
          image: images.ABSTRACT,
          width: 450,
        },
        {
          image: images[metadata.others.logoName],
          width: 400,
          absolutePosition: { x: 350, y: 180 },
        },
        {
          text: metadata.title,
          fontSize: 40,
          color: '#777',
          bold: true,
          absolutePosition: { x: 150, y: 450 },
          pageBreak: 'after',
        },

        {
          toc: {
            title: {
              text: ' In this complianceList Report',
              style: 'tocTitle',
            },
            numberStyle: 'tocNumber',
          },
          margin: [60, 35, 20, 60],
          pageBreak: 'after',
        },

        {
          text: [
            {
              text: metadata.others.reportSummary,
              style: 'contentHeader',
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: '#4863A0',
                margin: [80, 15, 0, 60],
              },
            },
            {
              text: `    ${metadata.others.summaryRange}`,
              color: '#3090C7',
              fontSize: 10,
            },
          ],
        },

        {
          text: metadata.others.topImpactfulcomplianceList,
          style: 'contentSubHeader',
          tocItem: true,
          tocStyle: {
            fontSize: 12,
            italic: true,
            color: 'black',
            margin: [95, 10, 0, 60],
          },
        },

        {
          columns: [
            {
              image: charts.canvas.topImpactfulCompliance,
              width: 700,
            },
          ],
        },

        {
          text: metadata.others.topImpactfulComplianceOnContainers,
          style: 'contentSubHeader',
          tocItem: true,
          tocStyle: {
            fontSize: 12,
            italic: true,
            color: 'black',
            margin: [95, 10, 0, 60],
          },
        },

        {
          columns: [
            {
              image: charts.canvas.topImpactfulComplianceOnContainers,
              width: 700,
            },
          ],

          pageBreak: 'after',
        },

        {
          text: [
            {
              text: metadata.others.subTitleDetails,
              style: 'contentHeader',
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: '#4863A0',
                margin: [80, 15, 0, 60],
              },
            },
            {
              text: `    ${metadata.others.detailsLimit}`,
              color: '#fe6e6b',
              fontSize: 10,
            },
          ],
        },

        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['10%', '6%', '18%', '6%', '7%', '5%', '23%', '25%'],
            body: [
              [
                { text: metadata.header.category, style: 'tableHeader' },
                { text: metadata.header.name, style: 'tableHeader' },
                { text: metadata.header.desc, style: 'tableHeader' },
                { text: metadata.header.level, style: 'tableHeader' },
                { text: metadata.header.scored, style: 'tableHeader' },
                { text: metadata.header.profile, style: 'tableHeader' },
                { text: metadata.header.impact, style: 'tableHeader' },
                { text: metadata.header.remediation, style: 'tableHeader' },
              ],
            ],
          },
          pageBreak: 'after',
        },
        {
          text: [
            {
              text: metadata.others.appendixText,
              style: 'contentHeader',
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: '#4863A0',
                margin: [80, 15, 0, 60],
              },
            },
            {
              text: `    (${metadata.others.appendixDesc})`,
              color: '#3090C7',
              fontSize: 10,
            },
          ],
        },
        {
          text: '\n\n',
        },
      ],
      styles: {
        pageHeader: {
          fontSize: 14,
          italic: true,
          bold: true,
          color: 'grey',
          margin: [0, 10, 5, 5],
        },
        pageFooter: {
          fontSize: 12,
          color: 'grey',
          margin: [0, 5, 55, 5],
        },
        pageFooterImage: {
          width: 750,
          height: 1,
          margin: [50, 5, 10, 10],
        },
        tocTitle: {
          fontSize: 22,
          color: '#566D7E',
          lineHeight: 2,
        },
        tocNumber: {
          italics: true,
          fontSize: 15,
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          alignment: 'center',
        },
        contentHeader: {
          fontSize: 16,
          bold: true,
          color: '#3090C7',
          margin: [0, 10, 0, 10],
        },
        contentSubHeader: {
          fontSize: 14,
          bold: true,
          color: 'black',
          margin: [0, 10, 0, 10],
        },
        content: {
          fontSize: 10,
          margin: [5, 5, 5, 5],
        },
        title: {
          bold: true,
          fontSize: 8,
        },
        subTitle: {
          bold: true,
          fontSize: 7,
        },
        appendixTitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 2, 0, 2],
        },
        appendixText: {
          fontSize: 8,
          margin: [0, 2, 0, 2],
        },
        error: {
          bold: true,
          color: '#dc4034',
          fontSize: 8,
        },
        high: {
          bold: true,
          color: '#ef5350',
          fontSize: 8,
        },
        warn: {
          bold: true,
          color: '#ff9800',
          fontSize: 8,
        },
        note: {
          bold: true,
          color: '#ffb661',
          fontSize: 8,
        },
        info: {
          bold: true,
          color: '#2196f3',
          fontSize: 8,
        },
        pass: {
          bold: true,
          color: '#6A8E6D',
          fontSize: 8,
        },
      },
    };

    let index = 1;

    for (let item of docData.data) {
      docDefinition.content[11].table.body.push(
        this._getRowData(item, index, metadata)
      );
      index++;
    }
    docDefinition.content = docDefinition.content.concat(
      this.prepareAppendix(docData)
    );
    console.log(docDefinition);
    return docDefinition;
  };

  private drawReport(docDefinition) {
    let report = pdfMake.createPdf(docDefinition);
    report.getBlob(blob => {
      saveAs(
        blob,
        `${this.translateService.instant(
          'cis.report.TITLE'
        )}${this.getRegulationTitlePostfix()}_${this.utilsService.parseDatetimeStr(
          new Date()
        )}.pdf`
      );
    });
  }

  private getRegulationTitlePostfix() {
    const advFilter = this.complianceFilterService.advFilter;
    const regs = Object.keys(advFilter.tags).filter(key => advFilter.tags[key]);
    if (regs.length > 0)
      return ` - ${Object.keys(advFilter.tags)
        .filter(key => advFilter.tags[key])
        .map(_ => _.toUpperCase())
        .join(' ')}`;
    else return '';
  }

  private getChartsForPDF() {
    let topImpactfulCompliance = (
      document?.getElementById('bar12PDF') as HTMLCanvasElement
    ).toDataURL();
    let topImpactfulComplianceOnContainers = (
      document.getElementById('bar22PDF') as HTMLCanvasElement
    ).toDataURL();

    return {
      canvas: {
        topImpactfulCompliance,
        topImpactfulComplianceOnContainers,
      },
    };
  }
}
