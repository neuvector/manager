import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

export const assetsViewPdfJob = () => {
  const prepareData4Filtered = function (masterData, vuls, advFilter) {
    let grids = [[], [], [], []];
    let workloadMap4FilteredPdf = {};
    let hostMap4FilteredPdf = {};
    let imageMap4FilteredPdf = {};
    vuls.forEach(vul => {
      if (
        vul.workloads &&
        Array.isArray(vul.workloads) &&
        vul.workloads.length > 0 &&
        (advFilter.containerName ||
          advFilter.serviceName ||
          advFilter.selectedDomains.length > 0)
      ) {
        let vulWorkloadInit = {
          pod_name: '',
          domain: '',
          applications: [],
          policy_mode: '',
          service_group: '',
          scanned_at: '',
          high: 0,
          medium: 0,
          evaluation: 0,
          vulnerabilites: [],
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
          .map(item => item.name.trim())
          .filter(item => item.length > 0);
        console.log('domainPatterns: ', servicePatterns);
        vul.workloads.forEach(workload => {
          if (masterData.workloadMap4Pdf[workload.id])
            console.log(
              'workloads: ',
              masterData.workloadMap4Pdf[workload.id].service_group,
              new RegExp(domainPatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].service_group
              )
            );
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
            console.log(
              'workloads_1: ',
              masterData.workloadMap4Pdf[workload.id].service_group,
              new RegExp(domainPatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].service_group
              )
            );
            let vulWorkload = workloadMap4FilteredPdf[workload.id];
            if (vulWorkload) {
              vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulWorkload.medium +=
                vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulWorkload.evaluation =
                vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
              vulWorkload.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            } else {
              vulWorkload = JSON.parse(JSON.stringify(vulWorkloadInit));
              let workloadInfo = masterData.workloadMap4Pdf[workload.id];
              vulWorkload.pod_name = workload.display_name;
              vulWorkload.domain = workloadInfo.domain;
              vulWorkload.applications = workloadInfo.applications;
              vulWorkload.policy_mode = workload.policy_mode;
              vulWorkload.service_group = workloadInfo.service_group;
              vulWorkload.scanned_at = workloadInfo.scanned_at;
              vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulWorkload.medium +=
                vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulWorkload.evaluation =
                vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
              vulWorkload.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            }
            workloadMap4FilteredPdf[workload.id] = vulWorkload;
          }
        });
      }
      if (
        vul.nodes &&
        Array.isArray(vul.nodes) &&
        vul.nodes.length > 0 &&
        advFilter.nodeName
      ) {
        let vulHostInit = {
          name: '',
          os: '',
          kernel: '',
          cpus: 0,
          memory: 0,
          containers: 0,
          policy_mode: '',
          scanned_at: '',
          high: 0,
          medium: 0,
          evaluation: 0,
          vulnerabilites: [],
        };
        let patterns = advFilter.nodeName.split(',').map(item => item.trim());
        vul.nodes.forEach(host => {
          if (new RegExp(patterns.join('|')).test(host.display_name)) {
            let vulHost = hostMap4FilteredPdf[host.id];
            if (vulHost) {
              vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulHost.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulHost.evaluation =
                vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
              vulHost.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            } else {
              vulHost = JSON.parse(JSON.stringify(vulHostInit));
              let hostInfo = masterData.hostMap4Pdf[host.id];
              vulHost.name = host.display_name;
              vulHost.os = hostInfo.os;
              vulHost.kernel = hostInfo.kernel;
              vulHost.cpus = hostInfo.cpus;
              vulHost.memory = hostInfo.memory;
              vulHost.containers = hostInfo.containers;
              vulHost.policy_mode = host.policy_mode;
              vulHost.scanned_at = host.scanned_at;
              vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulHost.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulHost.evaluation =
                vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
              vulHost.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            }
            hostMap4FilteredPdf[host.id] = vulHost;
          }
        });
      }
      if (
        vul.images &&
        Array.isArray(vul.images) &&
        vul.images.length > 0 &&
        advFilter.imageName
      ) {
        let vulImageInit = {
          image_name: '',
          high: 0,
          medium: 0,
          vulnerabilites: [],
        };
        let patterns = advFilter.imageName.split(',').map(item => item.trim());
        vul.images.forEach(image => {
          if (new RegExp(patterns.join('|')).test(image.display_name)) {
            let vulImage = imageMap4FilteredPdf[image.id];
            if (vulImage) {
              vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulImage.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulImage.evaluation =
                vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
              vulImage.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            } else {
              vulImage = JSON.parse(JSON.stringify(vulImageInit));
              vulImage.image_name = image.display_name;
              vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulImage.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulImage.evaluation =
                vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
              vulImage.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            }
            imageMap4FilteredPdf[image.id] = vulImage;
          }
        });
      }
    });
    grids[0] = Object.values(workloadMap4FilteredPdf);
    grids[1] = Object.values(hostMap4FilteredPdf);
    grids[3] = Object.values(imageMap4FilteredPdf);
    return grids;
  };
  const mergeData4NonFiltered = function (masterData, vuls) {
    console.log('Input: ', JSON.parse(JSON.stringify(masterData)), vuls);
    let grids = [[], [], [], []]; //workloads, hosts, platforms, images
    vuls.forEach(vul => {
      if (
        vul.workloads &&
        Array.isArray(vul.workloads) &&
        vul.workloads.length > 0
      ) {
        vul.workloads.forEach(workload => {
          let vulWorkload = masterData.workloadMap4Pdf[workload.id];
          if (vulWorkload) {
            vulWorkload.vulnerabilites.push({
              text: vul.name,
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulWorkload.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            vulWorkload.evaluation =
              vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
            masterData.workloadMap4Pdf[workload.id] = vulWorkload;
          }
        });
      }
      if (vul.nodes && Array.isArray(vul.nodes) && vul.nodes.length > 0) {
        vul.nodes.forEach(host => {
          let vulHost = masterData.hostMap4Pdf[host.id];
          if (vulHost) {
            vulHost.vulnerabilites.push({
              text: vul.name,
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulHost.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            vulHost.evaluation = vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
            masterData.hostMap4Pdf[host.id] = vulHost;
          }
        });
      }
      if (
        vul.platforms &&
        Array.isArray(vul.platforms) &&
        vul.platforms.length > 0
      ) {
        vul.platforms.forEach(platform => {
          let vulPlatform = masterData.platformMap4Pdf[platform.id];
          if (vulPlatform) {
            vulPlatform.vulnerabilites.push({
              text: vul.name,
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulPlatform.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulPlatform.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            masterData.platformMap4Pdf[platform.id] = vulPlatform;
          }
        });
      }
      if (vul.images && Array.isArray(vul.images) && vul.images.length > 0) {
        let otherVulImageInit = {
          image_id: '',
          image_name: '',
          high: 0,
          medium: 0,
          evaluation: 0,
          vulnerabilites: [],
        };
        vul.images.forEach(image => {
          let vulImage = masterData.imageMap4Pdf[image.id];
          if (vulImage) {
            vulImage.vulnerabilites.push({
              text: vul.name,
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulImage.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            vulImage.evaluation =
              vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = vulImage;
          } else {
            let otherVulImage = JSON.parse(JSON.stringify(otherVulImageInit));
            otherVulImage.image_id = image.id;
            otherVulImage.image_name = image.display_name;
            otherVulImage.vulnerabilites.push({
              text: vul.name,
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            otherVulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            otherVulImage.medium +=
              vul.severity.toLowerCase() === 'high' ? 0 : 1;
            otherVulImage.evaluation =
              otherVulImage.high > 0 || otherVulImage.medium > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = otherVulImage;
          }
        });
      }
    });
    grids[0] = Object.values(masterData.workloadMap4Pdf);
    grids[1] = Object.values(masterData.hostMap4Pdf);
    grids[2] = Object.values(masterData.platformMap4Pdf);
    grids[3] = Object.values(masterData.imageMap4Pdf);
    console.log('grids: ', JSON.parse(JSON.stringify(grids)));
    return grids;
  };

  const prepareDetails = function (masterData, vuls, isFiltered, advFilter) {
    console.log(
      'Input: ',
      JSON.parse(JSON.stringify(masterData)),
      vuls,
      isFiltered,
      advFilter
    );
    if (isFiltered) {
      return prepareData4Filtered(masterData, vuls, advFilter);
    } else {
      return mergeData4NonFiltered(masterData, vuls);
    }
  };

  const _getScore = function (item, metadata) {
    let scoreList: any = {};
    let scoreStyle = '';
    if (
      item.severity.toLowerCase() === 'high' ||
      item.severity.toLowerCase() === 'critical'
    ) {
      scoreStyle = 'danger';
    } else if (
      item.severity.toLowerCase() === 'medium' ||
      item.severity.toLowerCase() === 'warning'
    ) {
      scoreStyle = 'warning';
    } else {
      scoreStyle = 'info';
    }
    scoreList.ul = [
      { text: `${metadata.data.v2}: ${item.score}`, style: scoreStyle },
      {
        text: `${metadata.data.v3}: ${item.score_v3}`,
        style: scoreStyle,
      },
    ];
    return scoreList;
  };

  const _getPackage = function (item, metadata, isFullList) {
    let details: any = [];
    let packages = Object.entries(item.packages);
    let originalPackageCount = packages.length;
    if (!isFullList) {
      packages = packages.slice(0, 3);
    }
    packages.forEach(([k, v]) => {
      let packageName = {};
      if (k) {
        packageName = {
          text: [k],
        };
      }

      let version;
      let impactedVersion: any = {};
      impactedVersion.ul = [];
      let fixedVersion: any = {};
      fixedVersion.ul = [];

      if (v && Array.isArray(v)) {
        v.forEach(package_version => {
          impactedVersion.ul.push(package_version.package_version);
          fixedVersion.ul.push(
            package_version.fixed_version
              ? package_version.fixed_version
              : 'N/A'
          );
        });
      }
      version = {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: metadata.data.impactedVersion },
              { text: metadata.data.fixedVersion },
            ],
            [impactedVersion, fixedVersion],
          ],
        },
        layout: {
          hLineColor: 'gray',
          vLineColor: 'gray',
        },
      };
      details.push([packageName, version]);
    });
    if (originalPackageCount > 3 && !isFullList) {
      details.push([{ text: `...... (${originalPackageCount} Packages)` }]);
    }
    return details;
  };

  const _getRowData2 = function (item, id, metadata) {
    let name = item.name;
    let description = item.description;
    let score = _getScore(item, metadata);
    let _package = _getPackage(item, metadata, false);
    let publishedTime = item.published_datetime;

    return [name, description, score, _package, publishedTime];
  };

  const getTitleText = function (isFiltered) {
    if (isFiltered) {
      return 'Filtered Vulnerabilities Report (Assets View)';
    } else {
      return 'Full Vulnerabilities Report (Assets View)';
    }
  };

  const preparePackagesWith3Columns = function (item, metaData) {
    let packagesMatrix: any = [];
    let rowData: any = [];
    let packageGrids = _getPackage(item, metaData, true);
    for (let i = 0; i < packageGrids.length; i++) {
      if (i % 3 === 0) {
        if (Math.floor(i / 3) > 0)
          packagesMatrix.push({
            columns: JSON.parse(JSON.stringify(rowData)),
          });
        rowData = [{}, {}, {}];
      }
      rowData[i % 3] = packageGrids[i];
    }
    packagesMatrix.push({ columns: JSON.parse(JSON.stringify(rowData)) });
    return packagesMatrix;
  };

  const prepareAppendix = function (docData) {
    console.log('docData.data: ', JSON.parse(JSON.stringify(docData)));
    let appendix4Packages: any = [];
    docData.data.vulnerabilities.forEach(item => {
      let cve = {
        text: item.name,
        style: 'appendixTitle',
      };

      let packagesRaw = Object.entries(item.packages);
      let packageCount = packagesRaw.length;
      let packages = preparePackagesWith3Columns(item, docData.metadata);
      let lineBreak = {
        text: '\n\n',
      };
      appendix4Packages.push(cve);
      if (packageCount > 0) {
        appendix4Packages.push(packages);
      }
      appendix4Packages.push(lineBreak);
    });
    return {
      appendix4Packages,
    };
  };

  const _formatContent2 = function (docData) {
    let metadata = docData.metadata;
    let images = docData.images;
    let charts = docData.charts;
    let titleText = getTitleText(docData.data.isAdvFilterOn);

    let docDefinition: any = {
      info: {
        title: metadata.title,
        author: 'NeuVector',
        subject: 'Vulnerability report (Service View)',
        keywords:
          'vulnerability report service group pods container workload host node platform image',
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
          return {};
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
              text: '    (Please refer appendix for details of CVEs)',
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
            widths: ['15%', '10%', '12%', '7%', '10%', '8%', '32%', '6%'],
            body: [
              [
                { text: metadata.wlHeader.name, style: 'tableHeader' },
                { text: metadata.wlHeader.domain, style: 'tableHeader' },
                { text: metadata.wlHeader.apps, style: 'tableHeader' },
                {
                  text: metadata.wlHeader.policyMode,
                  style: 'tableHeader',
                },
                { text: metadata.wlHeader.group, style: 'tableHeader' },
                { text: metadata.header.vulsCnt, style: 'tableHeader' },
                { text: metadata.header.vuls, style: 'tableHeader' },
                {
                  text: metadata.wlHeader.scanned_at,
                  style: 'tableHeader',
                },
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
            widths: [
              '11%',
              '6%',
              '10%',
              '6%',
              '7%',
              '10%',
              '10%',
              '8%',
              '24%',
              '8%',
            ],
            body: [
              [
                { text: metadata.htHeader.name, style: 'tableHeader' },
                { text: metadata.htHeader.os, style: 'tableHeader' },
                { text: metadata.htHeader.kernel, style: 'tableHeader' },
                { text: metadata.htHeader.cpus, style: 'tableHeader' },
                { text: metadata.htHeader.memory, style: 'tableHeader' },
                {
                  text: metadata.htHeader.containers,
                  style: 'tableHeader',
                },
                {
                  text: metadata.htHeader.policyMode,
                  style: 'tableHeader',
                },
                { text: metadata.header.vulsCnt, style: 'tableHeader' },
                { text: metadata.header.vuls, style: 'tableHeader' },
                {
                  text: metadata.wlHeader.scanned_at,
                  style: 'tableHeader',
                },
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
                { text: metadata.header.vulsCnt, style: 'tableHeader' },
                { text: metadata.header.vuls, style: 'tableHeader' },
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
                { text: metadata.header.vulsCnt, style: 'tableHeader' },
                { text: metadata.header.vuls, style: 'tableHeader' },
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
            widths: ['15%', '30%', '8%', '30%', '17%'],
            body: [
              [
                { text: metadata.header.name, style: 'tableHeader' },
                { text: metadata.header.desc, style: 'tableHeader' },
                { text: metadata.header.score, style: 'tableHeader' },
                { text: metadata.header.package, style: 'tableHeader' },
                {
                  text: metadata.header.publishedTime,
                  style: 'tableHeader',
                },
              ],
            ],
          },
        },
        {
          text: [
            {
              text: metadata.others.appendixPackagesText,
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
              text: `    (${metadata.others.appendixPackagesDesc})`,
              color: '#3090C7',
              fontSize: 10,
            },
          ],
          pageBreak: 'before',
        },
        {},
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
        warning: {
          bold: true,
          color: '#ff9800',
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

    let detailGrids = prepareDetails(
      docData.data.masterData,
      docData.data.vulnerabilities,
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

    const _getVuls = function (vuls) {
      return JSON.parse(
        `{"text":[${vuls
          .slice(0, 350)
          .map(vul => {
            return JSON.stringify(vul);
          })
          .join(',{"text": ", "},')}${
          vuls.length > 350 ? `,{"text": "......(Total: ${vuls.length})"}` : ''
        }]}`
      );
    };

    const _getHiMed = function (high, medium) {
      return high + medium > 0
        ? {
            text: [
              { text: high.toString(), style: 'danger' },
              { text: '/' },
              { text: medium.toString(), style: 'warning' },
            ],
          }
        : { text: 'No Vulnerabilities', style: 'success' };
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
      let hiMed = _getHiMed(item.high, item.medium);
      let vuls = _getVuls(item.vulnerabilites);
      let scanned_at = item.scanned_at;

      return [name, domain, apps, policyMode, group, hiMed, vuls, scanned_at];
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
      let hiMed = _getHiMed(item.high, item.medium);
      let vuls = _getVuls(item.vulnerabilites);
      let scanned_at = item.scanned_at;

      return [
        name,
        os,
        kernel,
        cpus,
        memory,
        containers,
        policyMode,
        hiMed,
        vuls,
        scanned_at,
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
      let hiMed = _getHiMed(item.high, item.medium);
      let vuls = _getVuls(item.vulnerabilites);

      return [name, version, baseOs, hiMed, vuls];
    };

    const _getRowData4Images = function (item) {
      let name = item.image_name;
      let hiMed = _getHiMed(item.high, item.medium);
      let vuls = _getVuls(item.vulnerabilites);

      return [name, hiMed, vuls];
    };

    detailGrids[0].sort((a: any, b: any) => {
      return b.high + b.medium - (a.high + a.medium);
    });

    detailGrids[1].sort((a: any, b: any) => {
      return b.high + b.medium - (a.high + a.medium);
    });

    detailGrids[2].sort((a: any, b: any) => {
      return b.high + b.medium - (a.high + a.medium);
    });

    detailGrids[3].sort((a: any, b: any) => {
      return b.high + b.medium - (a.high + a.medium);
    });

    if (detailGrids[0].length > 0) {
      let compliantWorkloads = 0;
      for (let item of detailGrids[0] as any) {
        compliantWorkloads += item.evaluation === 0 ? 1 : 0;
        docDefinition.content[7].table.body.push(_getRowData4Workloads(item));
      }
      docDefinition.content[6].text = `${
        docDefinition.content[6].text
      } (Compliant Workloads (No vulnerabilities): ${Math.round(
        (compliantWorkloads / detailGrids[0].length) * 100
      )}% (${compliantWorkloads} Workload(s)))`;
    } else {
      docDefinition.content[6] = {};
      docDefinition.content[7] = {};
    }

    if (detailGrids[1].length > 0) {
      let compliantHosts = 0;
      for (let item of detailGrids[1] as any) {
        compliantHosts += item.evaluation === 0 ? 1 : 0;
        docDefinition.content[9].table.body.push(_getRowData4Hosts(item));
      }
      docDefinition.content[8].text[0].text = `${
        docDefinition.content[8].text[0].text
      } (Compliant Hosts (No vulnerabilities): ${Math.round(
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
      for (let item of detailGrids[3] as any) {
        compliantImages += item.evaluation === 0 ? 1 : 0;
        docDefinition.content[13].table.body.push(_getRowData4Images(item));
      }
      docDefinition.content[12].text[0].text = `${
        docDefinition.content[12].text[0].text
      } (Compliant Images (No vulnerabilities): ${Math.round(
        (compliantImages / detailGrids[3].length) * 100
      )}% (${compliantImages} Image(s)))`;
    } else {
      docDefinition.content[12] = {};
      docDefinition.content[13] = {};
    }

    let index4Appendix = 1;
    for (let item of docData.data.vulnerabilities) {
      docDefinition.content[16].table.body.push(
        _getRowData2(item, index4Appendix, metadata)
      );
      index4Appendix++;
    }

    docDefinition.content[18] = prepareAppendix(docData).appendix4Packages;

    console.log('docDefinition: ', docDefinition);

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
