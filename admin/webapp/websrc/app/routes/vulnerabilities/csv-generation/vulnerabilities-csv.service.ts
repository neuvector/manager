import { Injectable } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { VulnerabilitiesFilterService } from '../vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { DatePipe } from '@angular/common';
import { BytesPipe } from '@common/pipes/app.pipes';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { VulnerabilityAsset } from '@common/types';

@Injectable()
export class VulnerabilitiesCsvService {
  constructor(
    private utilsService: UtilsService,
    private datePipe: DatePipe,
    private bytesPipe: BytesPipe,
    private vulnerabilitiesFilterService: VulnerabilitiesFilterService
  ) {}

  downloadCsv(vulnerabilityList, cveEntry?: VulnerabilityAsset) {
    console.log('DOWNLOAD CSV');
    let vulnerabilities4Csv = [];

    const listAssets = entryData => {
      let imageList = entryData.images
        ? entryData.images.map(image => image.display_name)
        : [];
      let workloadList = entryData.workloads
        ? entryData.workloads.map(workload => workload.display_name)
        : [];
      let serviceList = entryData.services || [];
      let domainList = entryData.domains || [];
      let nodeList = entryData.nodes
        ? entryData.nodes.map(node => node.display_name)
        : [];
      let platformList = entryData.platforms
        ? entryData.platforms.map(platform => platform.display_name)
        : [];
      let pv2fvList = Object.entries(entryData.packages).map(([k, v]) => {
        return `${k}:(${(v as any).reduce(
          (acc, curr) =>
            acc +
            curr.package_version +
            ' -> ' +
            (curr.fixed_version || 'N/A') +
            ' ',
          ''
        )})`;
      });
      let maxRow4Entry = Math.max(
        imageList?.length || 0,
        workloadList?.length || 0,
        serviceList?.length || 0,
        domainList?.length || 0,
        nodeList?.length || 0,
        platformList?.length || 0,
        pv2fvList.length || 0
      );
      maxRow4Entry = maxRow4Entry === 0 ? 1 : maxRow4Entry;
      let rows: any = [];
      for (let i = 0; i < maxRow4Entry; i++) {
        rows.push({
          name: i === 0 ? entryData.name : '',
          link: i === 0 ? entryData.link : '',
          severity: i === 0 ? entryData.severity : '',
          score: i === 0 ? entryData.score : '',
          score_v3: i === 0 ? entryData.score_v3 : '',
          vectors: i === 0 ? entryData.vectors : '',
          vectors_v3: i === 0 ? entryData.vectors_v3 : '',
          description: i === 0 ? entryData.description : '',
          platforms: i > platformList.length - 1 ? '' : platformList[i],
          nodes: i > (nodeList?.length || 0) - 1 ? '' : nodeList[i],
          domains: i > (domainList?.length || 0) - 1 ? '' : domainList[i],
          services: i > (serviceList?.length || 0) - 1 ? '' : serviceList[i],
          workloads: i > (workloadList?.length || 0) - 1 ? '' : workloadList[i],
          images: i > (imageList?.length || 0) - 1 ? '' : imageList[i],
          'package_versions->fixed_version':
            i > (pv2fvList?.length || 0) - 1 ? '' : pv2fvList[i],
          last_modified_datetime:
            i === 0
              ? this.datePipe.transform(
                  entryData.last_modified_timestamp * 1000,
                  'MMM dd, y HH:mm:ss'
                )
              : '',
          published_datetime:
            i === 0
              ? this.datePipe.transform(
                  entryData.published_timestamp * 1000,
                  'MMM dd, y HH:mm:ss'
                )
              : '',
        });
      }
      return rows;
    };

    const resolveExcelCellLimit = function (entryData) {
      let maxLen = Math.max(
        entryData.images ? entryData.images.length : 0,
        entryData.workloads ? entryData.workloads.length : 0,
        entryData.services ? entryData.services.length : 0,
        entryData.domains ? entryData.domains.length : 0,
        entryData['package_versions->fixed_version']
          ? entryData['package_versions->fixed_version'].length
          : 0
      );
      let maxRow4Entry = Math.ceil(maxLen / MapConstant.EXCEL_CELL_LIMIT);
      maxRow4Entry = maxRow4Entry === 0 ? 1 : maxRow4Entry;
      let rows: any = [];
      for (let i = 0; i < maxRow4Entry; i++) {
        rows.push({
          name: i === 0 ? entryData.name : '',
          link: i === 0 ? entryData.link : '',
          severity: i === 0 ? entryData.severity : '',
          score: i === 0 ? entryData.score : '',
          score_v3: i === 0 ? entryData.score_v3 : '',
          vectors: i === 0 ? entryData.vectors : '',
          vectors_v3: i === 0 ? entryData.vectors_v3 : '',
          description: i === 0 ? entryData.description : '',
          platforms: i === 0 ? entryData.platforms : '',
          nodes: i === 0 ? entryData.nodes || '' : '',
          domains: entryData.domains
            ? entryData.domains.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.domains.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.domains.substring(MapConstant.EXCEL_CELL_LIMIT * i)
            : '',
          services: entryData.services
            ? entryData.services.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.services.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.services.substring(MapConstant.EXCEL_CELL_LIMIT * i)
            : '',
          workloads: entryData.workloads
            ? entryData.workloads.length >
              MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.workloads.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.workloads.substring(MapConstant.EXCEL_CELL_LIMIT * i)
            : '',
          images: entryData.images
            ? entryData.images.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.images.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.images.substring(MapConstant.EXCEL_CELL_LIMIT * i)
            : '',
          'package_versions->fixed_version': entryData[
            'package_versions->fixed_version'
          ]
            ? entryData['package_versions->fixed_version'].length >
              MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData['package_versions->fixed_version'].substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData['package_versions->fixed_version'].substring(
                  MapConstant.EXCEL_CELL_LIMIT * i
                )
            : '',
          last_modified_datetime:
            i === 0 ? entryData.last_modified_datetime : '',
          published_datetime: i === 0 ? entryData.published_datetime : '',
        });
      }
      return rows;
    };
    if (typeof vulnerabilityList === 'object') {
      if (Array.isArray(vulnerabilityList)) {
        if (vulnerabilityList && vulnerabilityList.length > 0) {
          vulnerabilityList.forEach(cve => {
            let entryData = this.prepareEntryData(
              JSON.parse(JSON.stringify(cve)),
              'vulnerability_view'
            );
            vulnerabilities4Csv = vulnerabilities4Csv.concat(
              resolveExcelCellLimit(entryData)
            );
          });
        }
      } else {
        vulnerabilities4Csv = vulnerabilities4Csv.concat(
          listAssets(vulnerabilityList)
        );
      }
    }

    let csv = arrayToCsv(vulnerabilities4Csv);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    let filename =
      cveEntry && cveEntry.name
        ? `${cveEntry.name}_${this.utilsService.parseDatetimeStr(
            new Date()
          )}.csv`
        : `Vulnerabilities_View_${this.utilsService.parseDatetimeStr(
            new Date()
          )}.csv`;
    saveAs(blob, filename);
  }

  downloadAssetsViewCsv = data => {
    console.log('data', data);
    let csvWorkloads = arrayToCsv(this.prepareContainersData(data.workloads));
    let csvNodes = arrayToCsv(this.prepareNodesData(data.nodes));
    let csvPlatforms = arrayToCsv(this.preparePlatformsData(data.platforms));
    let csvImages = arrayToCsv(this.prepareImagesData(data.images));
    let csvVuls = arrayToCsv(
      this.preprocessVulnerabilityCsvData(data.vulnerabilities)
    );

    let csvData = 'Containers\r\n'
      .concat(csvWorkloads)
      .concat('\r\n')
      .concat('Nodes\r\n')
      .concat(csvNodes)
      .concat('\r\n')
      .concat('Platforms\r\n')
      .concat(csvPlatforms)
      .concat('\r\n')
      .concat('Images\r\n')
      .concat(csvImages)
      .concat('\r\n')
      .concat('Vulnerability Details\r\n')
      .concat(csvVuls);
    let blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    let filename = `Assets_View_${this.utilsService.parseDatetimeStr(
      new Date()
    )}.csv`;
    saveAs(blob, filename);
  };

  private preprocessVulnerabilityCsvData = vuls => {
    return vuls.map(cve => {
      return this.prepareEntryData(cve, 'assets_view');
    });
  };

  private prepareContainersData = workloads => {
    return workloads.map(workload => {
      return {
        Name: workload.name,
        ID: workload.id,
        Namespace: workload.domain,
        'Service Group': workload.service_group,
        'Policy Mode': workload.policy_mode,
        Image: workload.image,
        Applications: workload.applications,
        Critical: workload.critical,
        High: workload.high,
        Medium: workload.medium,
        Low: workload.low,
        Vulnerabilities: workload.vulnerabilities.map(vul =>
          this.reformCveName(vul)
        ),
        'Scanned at': this.datePipe.transform(
          workload.scanned_at,
          'MMM dd, y HH:mm:ss'
        ),
      };
    });
  };
  private prepareNodesData = nodes => {
    return nodes.map(node => {
      return {
        Name: node.name,
        ID: node.id,
        Containers: node.containers,
        CPUs: node.cpus,
        OS: node.os,
        Kernel: node.kernel,
        Memory: this.bytesPipe.transform(node.memory),
        'Policy Mode': node.policy_mode,
        Critical: node.critical,
        High: node.high,
        Medium: node.medium,
        Low: node.low,
        Vulnerabilities: node.vulnerabilities.map(vul =>
          this.reformCveName(vul)
        ),
        'Scanned at': this.datePipe.transform(
          node.scanned_at,
          'MMM dd, y HH:mm:ss'
        ),
      };
    });
  };
  private preparePlatformsData = platforms => {
    return platforms.map(platform => {
      return {
        Name: platform.name,
        Version: platform.version,
        'Base OS': platform.base_os,
        Critical: platform.critical,
        High: platform.high,
        Medium: platform.medium,
        Low: platform.low,
        Vulnerabilities: platform.vulnerabilities.map(vul =>
          this.reformCveName(vul)
        ),
        'Scanned at': this.datePipe.transform(
          platform.scanned_at,
          'MMM dd, y HH:mm:ss'
        ),
      };
    });
  };
  private prepareImagesData = images => {
    return images.map(image => {
      return {
        Name: image.platform,
        ID: image.id,
        Critical: image.critical,
        High: image.high,
        Medium: image.medium,
        Low: image.low,
        Vulnerabilities: image.vulnerabilities.map(vul =>
          this.reformCveName(vul)
        ),
      };
    });
  };

  private reformCveName = cveName => {
    let cveNameArray = cveName.split('_');
    return `${cveNameArray[1]} (${cveNameArray[0]})`;
  };

  private prepareEntryData = (cve, reportType: string) => {
    cve.description = cve.description
      ? `${cve.description.replace(/\"/g, "'")}`
      : '';
    if (cve.platforms && Array.isArray(cve.platforms)) {
      cve.platforms = cve.platforms.reduce(
        (acc, curr) => acc + curr.display_name + ' ',
        ''
      );
    }
    if (cve.images && Array.isArray(cve.images)) {
      cve.images = cve.images.reduce(
        (acc, curr) => acc + curr.display_name + ' ',
        ''
      );
    }
    if (cve.nodes && Array.isArray(cve.nodes)) {
      cve.nodes = cve.nodes.reduce(
        (acc, curr) => acc + curr.display_name + ' ',
        ''
      );
    }
    if (cve.workloads && Array.isArray(cve.workloads)) {
      let filteredWorkload = cve.workloads;
      cve.workloads = Array.from(
        filteredWorkload.reduce(
          (acc, curr) => acc.add(curr.display_name),
          new Set()
        )
      ).join(' ');

      cve.services = Array.from(
        filteredWorkload.reduce((acc, curr) => acc.add(curr.service), new Set())
      ).join(' ');

      cve.domains = Array.from(
        filteredWorkload.reduce((acc, curr) => acc.add(curr.domain), new Set())
      ).join(' ');
      console.log(
        'cve.workloads: ',
        cve.workloads,
        'cve.services:',
        cve.services,
        'cve.domains:',
        cve.domains,
        'cve.images:',
        cve.images
      );
    }

    if (cve.packages) {
      cve['package_versions->fixed_version'] = Object.entries(cve.packages)
        .map(([k, v]) => {
          return `${k}:(${(v as any).reduce(
            (acc, curr) =>
              acc +
              curr.package_version +
              ' -> ' +
              (curr.fixed_version || 'N/A') +
              ' ',
            ''
          )})`;
        })
        .join(' ');
    }
    cve.last_modified_datetime = this.datePipe.transform(
      JSON.parse(JSON.stringify(cve.last_modified_timestamp)) * 1000,
      'MMM dd, y HH:mm:ss'
    );
    cve.published_datetime = this.datePipe.transform(
      JSON.parse(JSON.stringify(cve.published_timestamp)) * 1000,
      'MMM dd, y HH:mm:ss'
    );
    delete cve.package_versions;
    delete cve.packages;
    delete cve.published_timestamp;
    delete cve.last_modified_timestamp;
    if (reportType === 'assets_view') {
      delete cve.workloads;
      delete cve.nodes;
      delete cve.platforms;
      delete cve.images;
    }
    return cve;
  };
}
