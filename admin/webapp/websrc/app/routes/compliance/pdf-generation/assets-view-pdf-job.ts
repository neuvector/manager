import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

export const assetsViewPdfJob = () => {
  const prepareData4Filtered = function (
    masterData,
    complianceList,
    advFilter
  ) {
    let grids = [[], [], [], []];
    let workloadMap4FilteredPdf = {};
    let hostMap4FilteredPdf = {};
    let imageMap4FilteredPdf = {};
    complianceList.forEach(compliance => {
      if (
        compliance.workloads &&
        Array.isArray(compliance.workloads) &&
        compliance.workloads.length > 0 &&
        (advFilter.containerName ||
          advFilter.serviceName ||
          advFilter.selectedDomains.length > 0)
      ) {
        let compWorkloadInit = {
          pod_name: '',
          domain: '',
          applications: [],
          policy_mode: '',
          service_group: '',
          complianceCnt: 0,
          evaluation: 0,
          complianceList: [],
        };
        let patterns = advFilter.containerName
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        let servicePatterns = advFilter.serviceName
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        let domainPatterns = advFilter.selectedDomains
          .map(item => item.trim())
          .filter(item => item.length > 0);

        compliance.workloads.forEach(workload => {
          if (
            ((patterns.length > 0 &&
              new RegExp(patterns.join('|')).test(workload.display_name)) ||
              patterns.length === 0) &&
            ((servicePatterns.length > 0 &&
              masterData.workloadMap4Pdf[workload.id] &&
              new RegExp(servicePatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].service_group.substring(
                  3
                )
              )) ||
              servicePatterns.length === 0) &&
            ((domainPatterns.length > 0 &&
              masterData.workloadMap4Pdf[workload.id] &&
              new RegExp(domainPatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].domain
              )) ||
              domainPatterns.length === 0)
          ) {
            let compWorkload = workloadMap4FilteredPdf[workload.id];
            if (compWorkload) {
              compWorkload.complianceCnt++;
              compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
              compWorkload.complianceList.push({
                text: compliance.name.padEnd(12),
                style: compliance.level.toLowerCase(),
              });
            } else {
              compWorkload = JSON.parse(JSON.stringify(compWorkloadInit));
              let workloadInfo = masterData.workloadMap4Pdf[workload.id];
              compWorkload.pod_name = workload.display_name || '';
              compWorkload.domain = workloadInfo.domain || '';
              compWorkload.applications = workloadInfo.applications || '';
              compWorkload.policy_mode = workload.policy_mode || '';
              compWorkload.service_group = workloadInfo.service_group || '';
              compWorkload.complianceCnt++;
              compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
              compWorkload.complianceList.push({
                text: compliance.name.padEnd(12),
                style: compliance.level.toLowerCase(),
              });
            }
            workloadMap4FilteredPdf[workload.id] = compWorkload;
          }
        });
      }
      if (
        compliance.nodes &&
        Array.isArray(compliance.nodes) &&
        compliance.nodes.length > 0 &&
        advFilter.nodeName
      ) {
        let compHostInit = {
          name: '',
          os: '',
          kernel: '',
          cpus: 0,
          memory: 0,
          containers: 0,
          policy_mode: '',
          complianceCnt: 0,
          evaluation: 0,
          complianceList: [],
        };
        let patterns = advFilter.nodeName.split(',').map(item => item.trim());
        compliance.nodes.forEach(host => {
          if (new RegExp(patterns.join('|')).test(host.display_name)) {
            let compHost = hostMap4FilteredPdf[host.id];
            if (compHost) {
              compHost.complianceCnt++;
              compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
              compHost.complianceList.push({
                text: compliance.name.padEnd(12),
                style: compliance.level.toLowerCase(),
              });
            } else {
              compHost = JSON.parse(JSON.stringify(compHostInit));
              let hostInfo = masterData.hostMap4Pdf[host.id];
              compHost.name = host.display_name || '';
              compHost.os = hostInfo.os || '';
              compHost.kernel = hostInfo.kernel || '';
              compHost.cpus = hostInfo.cpus || '';
              compHost.memory = hostInfo.memory || '';
              compHost.containers = hostInfo.containers || '';
              compHost.policy_mode = host.policy_mode || '';
              compHost.complianceCnt++;
              compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
              compHost.complianceList.push({
                text: compliance.name.padEnd(12),
                style: compliance.level.toLowerCase(),
              });
            }
            hostMap4FilteredPdf[host.id] = compHost;
          }
        });
      }
      if (
        compliance.images &&
        Array.isArray(compliance.images) &&
        compliance.images.length > 0 &&
        advFilter.imageName
      ) {
        let compImageInit = {
          image_name: '',
          complianceCnt: 0,
          evaluation: 0,
          complianceList: [],
        };
        let patterns = advFilter.imageName.split(',').map(item => item.trim());
        compliance.images.forEach(image => {
          if (new RegExp(patterns.join('|')).test(image.display_name)) {
            let compImage = imageMap4FilteredPdf[image.id];
            if (compImage) {
              compImage.complianceCnt++;
              compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
              compImage.complianceList.push({
                text: compliance.name.padEnd(12),
                style: compliance.level.toLowerCase(),
              });
            } else {
              compImage = JSON.parse(JSON.stringify(compImageInit));
              compImage.image_name = image.display_name || '';
              compImage.complianceCnt++;
              compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
              compImage.complianceList.push({
                text: compliance.name.padEnd(12),
                style: compliance.level.toLowerCase(),
              });
            }
            imageMap4FilteredPdf[image.id] = compImage;
          }
        });
      }
    });
    grids[0] = Object.values(workloadMap4FilteredPdf);
    grids[1] = Object.values(hostMap4FilteredPdf);
    grids[3] = Object.values(imageMap4FilteredPdf);
    return grids;
  };

  const mergeData4NonFiltered = function (masterData, complianceList) {
    let grids = [[], [], [], []]; //workloads, hosts, platforms, images
    complianceList.forEach(compliance => {
      if (
        compliance.workloads &&
        Array.isArray(compliance.workloads) &&
        compliance.workloads.length > 0
      ) {
        compliance.workloads.forEach(workload => {
          let compWorkload = masterData.workloadMap4Pdf[workload.id];
          if (compWorkload) {
            compWorkload.complianceList.push({
              text: compliance.name.padEnd(12),
              style: compliance.level.toLowerCase(),
            });
            compWorkload.complianceCnt++;
            compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
            masterData.workloadMap4Pdf[workload.id] = compWorkload;
          }
        });
      }
      if (
        compliance.nodes &&
        Array.isArray(compliance.nodes) &&
        compliance.nodes.length > 0
      ) {
        compliance.nodes.forEach(host => {
          let compHost = masterData.hostMap4Pdf[host.id];
          if (compHost) {
            compHost.complianceList.push({
              text: compliance.name.padEnd(12),
              style: compliance.level.toLowerCase(),
            });
            compHost.complianceCnt++;
            compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
            masterData.hostMap4Pdf[host.id] = compHost;
          }
        });
      }
      if (
        compliance.platforms &&
        Array.isArray(compliance.platforms) &&
        compliance.platforms.length > 0
      ) {
        compliance.platforms.forEach(platform => {
          let compPlatform = masterData.platformMap4Pdf[platform.id];
          if (compPlatform) {
            compPlatform.complianceList.push({
              text: compliance.name.padEnd(12),
              style: compliance.level.toLowerCase(),
            });
            compPlatform.complianceCnt++;
            masterData.hostMap4Pdf[platform.id] = compPlatform;
          }
        });
      }
      if (
        compliance.images &&
        Array.isArray(compliance.images) &&
        compliance.images.length > 0
      ) {
        let otherCompImageInit = {
          image_id: '',
          image_name: '',
          complianceCnt: 0,
          evaluation: 0,
          complianceList: [],
        };
        compliance.images.forEach(image => {
          let compImage = masterData.imageMap4Pdf[image.id];
          if (compImage) {
            compImage.complianceList.push({
              text: compliance.name.padEnd(12),
              style: compliance.level.toLowerCase(),
            });
            compImage.complianceCnt++;
            compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = compImage;
          } else {
            let otherCompImage = JSON.parse(JSON.stringify(otherCompImageInit));
            otherCompImage.image_id = image.id;
            otherCompImage.image_name = image.display_name || '';
            otherCompImage.complianceList.push({
              text: compliance.name.padEnd(12),
              style: compliance.level.toLowerCase(),
            });
            otherCompImage.complianceCnt++;
            otherCompImage.evaluation =
              otherCompImage.complianceCnt > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = otherCompImage;
          }
        });
      }
    });
    grids[0] = Object.values(masterData.workloadMap4Pdf);
    grids[1] = Object.values(masterData.hostMap4Pdf);
    grids[2] = Object.values(masterData.platformMap4Pdf);
    grids[3] = Object.values(masterData.imageMap4Pdf);

    return grids;
  };

  const prepareDetails = function (
    masterData,
    complianceList,
    isFiltered,
    advFilter
  ) {
    if (isFiltered) {
      return prepareData4Filtered(masterData, complianceList, advFilter);
    } else {
      return mergeData4NonFiltered(masterData, complianceList);
    }
  };

  const _getLevelInfo = function (item) {
    let level: any = {};
    level.text = item.level;
    level.style = item.level.toLowerCase();

    return level;
  };

  const _getRowData2 = function (item, id, metadata) {
    let category = item.category;
    let name = item.name;
    let description = item.description;
    let level = _getLevelInfo(item);
    let scored = item.scored;
    let profile = item.profile;
    let remediation = item.remediation ? item.remediation : 'N/A';
    return [category, name, description, level, scored, profile, remediation];
  };

  const getTitleText = function (isFiltered) {
    if (isFiltered) {
      return 'Filtered Compliance Report (Assets View)';
    } else {
      return 'Full Compliance Report (Assets View)';
    }
  };

  const _formatContent2 = function (docData) {
    let metadata = docData.metadata;
    let images = docData.images;
    let charts = docData.charts;

    let titleText = getTitleText(docData.data.isFiltered);

    let docDefinition: any = {
      info: {
        title: metadata.title,
        author: 'NeuVector',
        subject: 'Compliance report (Service View)',
        keywords:
          'compliance report service group pods container workload host node platform image',
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
      header: function (currentPage) {
        if (currentPage === 2 || currentPage === 3) {
          return {
            text: metadata.others.headerText,
            alignment: 'center',
            italics: true,
            style: 'pageHeader',
          };
        } else {
          return;
        }
      },
      footer: function (currentPage) {
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
          text: metadata.title2,
          fontSize: 34,
          color: '#777',
          bold: true,
          absolutePosition: { x: 150, y: 450 },
          pageBreak: 'after',
        },
        {
          toc: {
            title: {
              text: titleText,
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
              text: '    (Please refer appendix for details of compliance)',
              color: '#4863A0',
              fontSize: 10,
            },
          ],
        },
        {
          text: 'Containers',
          color: '#4863A0',
          fontSize: 10,
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            dontBreakRows: false,
            widths: ['15%', '10%', '15%', '8%', '12%', '9%', '31%'],
            body: [
              [
                { text: metadata.wlHeader.name, style: 'tableHeader' },
                { text: metadata.wlHeader.domain, style: 'tableHeader' },
                { text: metadata.wlHeader.apps, style: 'tableHeader' },
                { text: metadata.wlHeader.policyMode, style: 'tableHeader' },
                { text: metadata.wlHeader.group, style: 'tableHeader' },
                { text: metadata.header.complianceCnt, style: 'tableHeader' },
                { text: metadata.header.complianceList, style: 'tableHeader' },
              ],
            ],
          },
          pageBreak: 'after',
        },
        {
          text: [
            {
              text: 'Hosts',
              color: '#4863A0',
              fontSize: 10,
            },
          ],
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            dontBreakRows: false,
            widths: ['11%', '6%', '11%', '7%', '7%', '9%', '10%', '9%', '30%'],
            body: [
              [
                { text: metadata.htHeader.name, style: 'tableHeader' },
                { text: metadata.htHeader.os, style: 'tableHeader' },
                { text: metadata.htHeader.kernel, style: 'tableHeader' },
                { text: metadata.htHeader.cpus, style: 'tableHeader' },
                { text: metadata.htHeader.memory, style: 'tableHeader' },
                { text: metadata.htHeader.containers, style: 'tableHeader' },
                { text: metadata.htHeader.policyMode, style: 'tableHeader' },
                { text: metadata.header.complianceCnt, style: 'tableHeader' },
                { text: metadata.header.complianceList, style: 'tableHeader' },
              ],
            ],
          },
          pageBreak: 'after',
        },
        {
          text: [
            {
              text: 'Platforms',
              color: '#4863A0',
              fontSize: 10,
            },
          ],
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            dontBreakRows: false,
            widths: ['10%', '10%', '10%', '10%', '60%'],
            body: [
              [
                { text: metadata.pfHeader.name, style: 'tableHeader' },
                { text: metadata.pfHeader.version, style: 'tableHeader' },
                { text: metadata.pfHeader.baseOs, style: 'tableHeader' },
                { text: metadata.header.complianceCnt, style: 'tableHeader' },
                { text: metadata.header.complianceList, style: 'tableHeader' },
              ],
            ],
          },
          pageBreak: 'after',
        },
        {
          text: [
            {
              text: 'Images',
              color: '#4863A0',
              fontSize: 10,
            },
          ],
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            dontBreakRows: false,
            widths: ['20%', '10%', '70%'],
            body: [
              [
                { text: metadata.mgHeader.name, style: 'tableHeader' },
                { text: metadata.header.complianceCnt, style: 'tableHeader' },
                { text: metadata.header.complianceList, style: 'tableHeader' },
              ],
            ],
          },
          pageBreak: 'after',
        },
        {
          text: [
            {
              text: metadata.others.appendixText2,
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
              text: `    (${metadata.others.appendixDesc2})`,
              color: '#3090C7',
              fontSize: 10,
            },
          ],
        },
        {
          text: '\n\n',
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            dontBreakRows: false,
            widths: ['10%', '6%', '26%', '6%', '7%', '5%', '40%'],
            body: [
              [
                { text: metadata.header.category, style: 'tableHeader' },
                { text: metadata.header.name, style: 'tableHeader' },
                { text: metadata.header.desc, style: 'tableHeader' },
                { text: metadata.header.level, style: 'tableHeader' },
                { text: metadata.header.scored, style: 'tableHeader' },
                { text: metadata.header.profile, style: 'tableHeader' },
                { text: metadata.header.remediation, style: 'tableHeader' },
              ],
            ],
          },
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
        danger: {
          bold: true,
          color: '#dc4034',
          fontSize: 8,
        },
        note: {
          bold: true,
          color: '#9aaabc',
          fontSize: 8,
        },
        warn: {
          bold: true,
          color: '#ff9800',
          fontSize: 8,
        },
        pass: {
          bold: true,
          color: '#64a150',
          fontSize: 8,
        },
        info: {
          bold: true,
          color: '#2196f3',
          fontSize: 8,
        },
        discover: {
          bold: true,
          color: '#2196f3',
          fontSize: 8,
        },
        monitor: {
          bold: true,
          color: '#4e39c1',
          fontSize: 8,
        },
        protect: {
          bold: true,
          color: '#64a150',
          fontSize: 8,
        },
        success: {
          bold: true,
          color: '#64a150',
          fontSize: 8,
        },
        error: {
          bold: true,
          color: '#e91e63',
          fontSize: 8,
        },
      },
    };

    let detailGrids: any = prepareDetails(
      docData.data.masterData,
      docData.data.complianceList,
      docData.data.isFiltered,
      docData.data.advFilter
    );

    const _getPlatformVerssion = function (name, kubeVersion, ocVersion) {
      if (name.toLowerCase().includes(metadata.others.KUBE)) {
        if (name.toLowerCase().includes(metadata.others.OC)) {
          return ocVersion;
        } else {
          return kubeVersion;
        }
      } else {
        return '';
      }
    };

    const _getStyledComplianceList = function (complianceList) {
      return JSON.parse(
        `{"text":[${complianceList
          .slice(0, 160)
          .map(compliance => {
            return JSON.stringify(compliance);
          })
          .join(',{"text": "     "},')}${
          complianceList.length > 160
            ? `,{"text": "......(Total: ${complianceList.length})"}`
            : ''
        }]}`
      );
    };

    const _getRowData4Workloads = function (item) {
      let name = item.pod_name;
      let domain = item.domain;
      let apps = item.applications.join(', ');
      let policyMode = {
        text: item.policy_mode,
        style: item.policy_mode.toLowerCase(),
      };
      let group = `${item.service_group}`;
      let cnt = item.complianceCnt;
      let complianceList = _getStyledComplianceList(item.complianceList);

      return [name, domain, apps, policyMode, group, cnt, complianceList];
    };

    const _getRowData4Hosts = function (item) {
      let name = item.name;
      let os = item.os;
      let kernel = item.kernel;
      let cpus = item.cpus;
      let memory = item.memory;
      let containers = item.containers;
      let policyMode = {
        text: item.policy_mode,
        style: item.policy_mode.toLowerCase(),
      };
      let cnt = item.complianceCnt;
      let complianceList = _getStyledComplianceList(item.complianceList);

      return [
        name,
        os,
        kernel,
        cpus,
        memory,
        containers,
        policyMode,
        cnt,
        complianceList,
      ];
    };

    const _getRowData4Platforms = function (item) {
      let name = item.platform;
      let version = _getPlatformVerssion(
        item.platform,
        item.kube_version,
        item.openshift_version
      );
      let baseOs = item.base_os;
      let cnt = item.complianceCnt;
      let complianceList = _getStyledComplianceList(item.complianceList);

      return [name, version, baseOs, cnt, complianceList];
    };

    const _getRowData4Images = function (item) {
      let name = item.image_name;
      let cnt = item.complianceCnt;
      let complianceList = _getStyledComplianceList(item.complianceList);

      return [name, cnt, complianceList];
    };

    detailGrids[0].sort((a, b) => {
      return b.complianceCnt - a.complianceCnt;
    });

    detailGrids[1].sort((a, b) => {
      return b.complianceCnt - a.complianceCnt;
    });

    detailGrids[2].sort((a, b) => {
      return b.complianceCnt - a.complianceCnt;
    });

    detailGrids[3].sort((a, b) => {
      return b.complianceCnt - a.complianceCnt;
    });

    if (detailGrids[0].length > 0) {
      let compliantWorkloads = 0;
      for (let item of detailGrids[0]) {
        compliantWorkloads += item.evaluation === 0 ? 1 : 0;
        docDefinition.content[7].table.body.push(_getRowData4Workloads(item));
      }
      docDefinition.content[6].text = `${
        docDefinition.content[6].text
      } (Compliant Workloads (No Compliance Violations): ${Math.round(
        (compliantWorkloads / detailGrids[0].length) * 100
      )}% (${compliantWorkloads} Workload(s)))`;
    } else {
      docDefinition.content[6] = {};
      docDefinition.content[7] = {};
    }

    if (detailGrids[1].length > 0) {
      let compliantHosts = 0;
      for (let item of detailGrids[1]) {
        compliantHosts += item.evaluation === 0 ? 1 : 0;
        docDefinition.content[9].table.body.push(_getRowData4Hosts(item));
      }
      docDefinition.content[8].text[0].text = `${
        docDefinition.content[8].text[0].text
      } (Compliant Hosts (No Compliance Violations): ${Math.round(
        (compliantHosts / detailGrids[1].length) * 100
      )}% (${compliantHosts} Host(s)))`;
    } else {
      docDefinition.content[8] = {};
      docDefinition.content[9] = {};
    }

    if (detailGrids[2].length > 0) {
      for (let item of detailGrids[2]) {
        docDefinition.content[11].table.body.push(_getRowData4Platforms(item));
      }
    } else {
      docDefinition.content[10] = {};
      docDefinition.content[11] = {};
    }

    if (detailGrids[3].length > 0) {
      let compliantImages = 0;
      for (let item of detailGrids[3]) {
        compliantImages += item.evaluation === 0 ? 1 : 0;
        docDefinition.content[13].table.body.push(_getRowData4Images(item));
      }
      docDefinition.content[12].text[0].text = `${
        docDefinition.content[12].text[0].text
      } (Compliant Images (No Compliance Violations): ${Math.round(
        (compliantImages / detailGrids[3].length) * 100
      )}% (${compliantImages} Image(s)))`;
    } else {
      docDefinition.content[12] = {};
      docDefinition.content[13] = {};
    }

    let index4Appendix = 1;
    for (let item of docData.data.complianceList) {
      docDefinition.content[16].table.body.push(
        _getRowData2(item, index4Appendix, metadata)
      );
      index4Appendix++;
    }

    return docDefinition;
  };

  let dateStart = new Date();
  console.log('Worker2 is starting...', dateStart.toTimeString());
  const showProgress = (function (self) {
    return function (progress) {
      if (Math.floor(progress * 100000) % 1000 === 0) {
        self.postMessage({ progress: progress });
      }
    };
  })(self);
  self.onmessage = event => {
    let docDefinition = _formatContent2(JSON.parse(event.data));

    docDefinition.header = function (currentPage) {
      if (currentPage === 2 || currentPage === 3) {
        return docDefinition.headerData;
      }
    };

    docDefinition.footer = function (currentPage) {
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

    const drawReportInWebWorker2 = function (docDefinition) {
      let report = pdfMake.createPdf(docDefinition);

      report.getBlob(
        function (blob) {
          let dateEnd = new Date();
          console.log('Worker2 is end...', dateEnd.toTimeString());
          self.postMessage({ blob: blob, progress: 1 });
          self.close();
        },
        { progressCallback: showProgress }
      );
    };
    drawReportInWebWorker2(docDefinition);
  };
  return _formatContent2;
};
