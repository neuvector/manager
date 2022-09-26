import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

export const complianceViewPdfJob = () => {
  console.log('Worker is starting...');
  const showProgress = (function (self) {
    return function (progress) {
      if (Math.floor(progress * 100000) % 1000 === 0) {
        self.postMessage({ progress: progress });
      }
    };
  })(self);
  self.onmessage = event => {
    let docDefinition = JSON.parse(event.data);

    let drawReportInWebWorker = function (docDefinition) {
      docDefinition.header = function (currentPage) {
        if (currentPage === 2 || currentPage === 3) {
          return docDefinition.headerData;
        }
      };

      docDefinition.footer = currentPage => {
        if (currentPage > 1) {
          return {
            stack: [
              docDefinition.footerData.line,
              {
                text: [
                  { text: docDefinition.footerData.text, italics: true },
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
      };

      let report = pdfMake.createPdf(docDefinition);

      report.getBlob(
        function (blob) {
          console.log('Worker is end...');
          self.postMessage({ blob: blob, progress: 1 });
          self.close();
        },
        { progressCallback: showProgress }
      );
    };
    drawReportInWebWorker(docDefinition);
  };
};
