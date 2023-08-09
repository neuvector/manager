import { Injectable } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { VulnerabilitiesFilterService } from '../vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { DatePipe } from '@angular/common';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { VulnerabilityAsset } from '@common/types';

@Injectable()
export class VulnerabilitiesCsvService {
  constructor(
    private utilsService: UtilsService,
    private datePipe: DatePipe,
    private vulnerabilitiesFilterService: VulnerabilitiesFilterService
  ) {}

  downloadCsv(cveEntry?: VulnerabilityAsset) {
    console.log('DOWNLOAD CSV');
    let vulnerabilities4Csv = [];
    const prepareEntryData = cve => {
      cve.description = cve.description
        ? `${cve.description.replace(/\"/g, "'")}`
        : '';
      if (cve.platforms && Array.isArray(cve.platform)) {
        cve.platforms = cve.platforms.reduce(
          (acc, curr) => acc + curr.display_name + ' ',
          ''
        );
      }
      if (cve.filteredImages && Array.isArray(cve.filteredImages)) {
        cve.images = cve.filteredImages.reduce(
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
        let filteredWorkload = cve.workloads.filter(workload =>
          this.vulnerabilitiesFilterService.namespaceFilter(workload)
        );

        filteredWorkload = filteredWorkload.filter(workload =>
          this.vulnerabilitiesFilterService.serviceFilter(workload)
        );

        filteredWorkload = filteredWorkload.filter(workload =>
          this.vulnerabilitiesFilterService.workloadFilter(workload)
        );

        cve.workloads = Array.from(
          filteredWorkload.reduce(
            (acc, curr) => acc.add(curr.display_name),
            new Set()
          )
        ).join(' ');

        cve.services = Array.from(
          filteredWorkload.reduce(
            (acc, curr) => acc.add(curr.service),
            new Set()
          )
        ).join(' ');

        cve.domains = Array.from(
          filteredWorkload.reduce(
            (acc, curr) => acc.add(curr.domain),
            new Set()
          )
        ).join(' ');

        cve.images = cve.images.concat(
          Array.from(
            filteredWorkload.reduce(
              (acc, curr) => acc.add(curr.image),
              new Set()
            )
          ).join(' ')
        );
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
      return cve;
    };

    const listAssets = entryData => {
      let imageList = entryData.images.map(image => image.display_name);
      let workloadList = entryData.workloads.map(
        workload => workload.display_name
      );
      let serviceList = entryData.services;
      let domainList = entryData.domains;
      let nodeList = entryData.nodes.map(node => node.display_name);
      let platformList = entryData.platforms.map(
        platform => platform.display_name
      );
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
        entryData.images.length,
        entryData.workloads.length,
        entryData.services.length,
        entryData.domains.length,
        entryData['package_versions->fixed_version'].length
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
          platforms:
            i === 0
              ? entryData.platforms
                  .map(platform => platform.display_name)
                  .join(' ')
              : '',
          nodes: i === 0 ? entryData.nodes : '',
          domains:
            entryData.domains.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.domains.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.domains.substring(MapConstant.EXCEL_CELL_LIMIT * i),
          services:
            entryData.services.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.services.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.services.substring(MapConstant.EXCEL_CELL_LIMIT * i),
          workloads:
            entryData.workloads.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.workloads.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.workloads.substring(MapConstant.EXCEL_CELL_LIMIT * i),
          images:
            entryData.images.length > MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData.images.substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData.images.substring(MapConstant.EXCEL_CELL_LIMIT * i),
          'package_versions->fixed_version':
            entryData['package_versions->fixed_version'].length >
            MapConstant.EXCEL_CELL_LIMIT * (i + 1)
              ? entryData['package_versions->fixed_version'].substring(
                  MapConstant.EXCEL_CELL_LIMIT * i,
                  MapConstant.EXCEL_CELL_LIMIT * (i + 1)
                )
              : entryData['package_versions->fixed_version'].substring(
                  MapConstant.EXCEL_CELL_LIMIT * i
                ),
          last_modified_datetime:
            i === 0 ? entryData.last_modified_datetime : '',
          published_datetime: i === 0 ? entryData.published_datetime : '',
        });
      }
      console.log('rows', rows);
      return rows;
    };
    const filteredVulnerabilities =
      this.vulnerabilitiesFilterService.filteredCis;
    if (filteredVulnerabilities && filteredVulnerabilities.length > 0) {
      if (cveEntry) {
        vulnerabilities4Csv = vulnerabilities4Csv.concat(listAssets(cveEntry));
      } else {
        filteredVulnerabilities.forEach(cve => {
          let entryData = prepareEntryData(JSON.parse(JSON.stringify(cve)));
          vulnerabilities4Csv = vulnerabilities4Csv.concat(
            resolveExcelCellLimit(entryData)
          );
        });
      }

      let csv = arrayToCsv(vulnerabilities4Csv);
      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      let filename =
        cveEntry && cveEntry.name
          ? `${cveEntry.name}_${this.utilsService.parseDatetimeStr(
              new Date()
            )}.csv`
          : `vulnerabilities_${this.utilsService.parseDatetimeStr(
              new Date()
            )}.csv`;
      saveAs(blob, filename);
    }
  }
}
