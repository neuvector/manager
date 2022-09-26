import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { arrayToCsv } from '@common/utils/common.utils';
import { ComplianceFilterService } from '../compliance.filter.service';
import { Compliance } from '@common/types';

@Injectable()
export class ComplianceCsvService {
  constructor(
    private utilsService: UtilsService,
    private complianceFilterService: ComplianceFilterService
  ) {}

  downloadCsv(compEntry?: Compliance) {
    let compliance4Csv = [];
    const prepareEntryData = compliance => {
      compliance.description = `${compliance.description.replace(/\"/g, "'")}`;
      compliance.platforms = compliance.platforms.reduce(
        (acc, curr) => acc + curr.display_name + ' ',
        ''
      );
      compliance.images = compliance.images.reduce(
        (acc, curr) => acc + curr.display_name + ' ',
        ''
      );
      compliance.nodes = compliance.nodes.reduce(
        (acc, curr) => acc + curr.display_name + ' ',
        ''
      );

      if (compliance.workloads && Array.isArray(compliance.workloads)) {
        let filteredWorkload = compliance.workloads.filter(workload =>
          this.complianceFilterService.namespaceFilter(workload)
        );

        filteredWorkload = filteredWorkload.filter(workload =>
          this.complianceFilterService.serviceFilter(workload)
        );

        filteredWorkload = filteredWorkload.filter(workload =>
          this.complianceFilterService.workloadFilter(workload)
        );

        compliance.workloads = Array.from(
          filteredWorkload.reduce(
            (acc, curr) => acc.add(curr.display_name),
            new Set()
          )
        ).join(' ');

        compliance.services = Array.from(
          filteredWorkload.reduce(
            (acc, curr) => acc.add(curr.service),
            new Set()
          )
        ).join(' ');

        compliance.domains = Array.from(
          filteredWorkload.reduce(
            (acc, curr) => acc.add(curr.domain),
            new Set()
          )
        ).join(' ');

        compliance.images = compliance.images.concat(
          Array.from(
            filteredWorkload.reduce(
              (acc, curr) => acc.add(curr.image),
              new Set()
            )
          ).join(' ')
        );
        console.log(
          'compliance.workloads: ',
          compliance.workloads,
          'compliance.services',
          compliance.services,
          'compliance.domains:',
          compliance.domains,
          'compliance.images:',
          compliance.images
        );
      }
      return compliance;
    };

    const listAssets = function (entryData: Compliance) {
      let imageList = entryData.images.map(image => image.display_name);
      let workloadList = entryData.workloads.map(
        workload => workload.display_name
      );
      let nodeList = entryData.nodes.map(node => node.display_name);
      let platformList = entryData.platforms.map(
        platform => platform.display_name
      );
      let maxRow4Entry = Math.max(
        imageList.length,
        workloadList.length,
        nodeList.length,
        platformList.length
      );
      maxRow4Entry = maxRow4Entry === 0 ? 1 : maxRow4Entry;
      let rows: any = [];
      for (let i = 0; i < maxRow4Entry; i++) {
        rows.push({
          name: i === 0 ? entryData.name : '',
          description: i === 0 ? entryData.description : '',
          category: i === 0 ? entryData.category : '',
          level: i === 0 ? entryData.level : '',
          message: i === 0 ? entryData.message : '',
          profile: i === 0 ? entryData.profile : '',
          remediation: i === 0 ? entryData.remediation : '',
          scored: i === 0 ? entryData.scored : '',
          tags: i === 0 ? entryData.tags : '',
          type: i === 0 ? entryData.type : '',
          platforms: i > platformList.length - 1 ? '' : platformList[i],
          nodes: i > nodeList.length - 1 ? '' : nodeList[i],
          workloads: i > workloadList.length - 1 ? '' : workloadList[i],
          images: i > imageList.length - 1 ? '' : imageList[i],
        });
      }
      return rows;
    };

    const resolveExcelCellLimit = function (entryData) {
      let maxLen = Math.max(
        entryData.images.length,
        entryData.workloads.length,
        entryData.services.length,
        entryData.domains.length
      );
      let maxRow4Entry = Math.ceil(maxLen / MapConstant.EXCEL_CELL_LIMIT);
      maxRow4Entry = maxRow4Entry === 0 ? 1 : maxRow4Entry;
      let rows: any = [];
      for (let i = 0; i < maxRow4Entry; i++) {
        rows.push({
          name: i === 0 ? entryData.name : '',
          description: i === 0 ? entryData.description : '',
          category: i === 0 ? entryData.category : '',
          level: i === 0 ? entryData.level : '',
          message: i === 0 ? entryData.message : '',
          profile: i === 0 ? entryData.profile : '',
          remediation: i === 0 ? entryData.remediation : '',
          scored: i === 0 ? entryData.scored : '',
          tags: i === 0 ? entryData.tags : '',
          type: i === 0 ? entryData.type : '',
          platforms: i === 0 ? entryData.platforms : '',
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
        });
      }
      return rows;
    };
    const filteredCis = this.complianceFilterService.filteredCis;
    if (filteredCis && filteredCis.length > 0) {
      if (compEntry) {
        compliance4Csv = compliance4Csv.concat(listAssets(compEntry));
      } else {
        filteredCis.forEach(compliance => {
          let entryData = prepareEntryData(
            JSON.parse(JSON.stringify(compliance))
          );
          compliance4Csv = compliance4Csv.concat(
            resolveExcelCellLimit(entryData)
          );
        });
      }
      let csv = arrayToCsv(compliance4Csv);
      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      let filename =
        compEntry && compEntry.name
          ? `${compEntry.name}_${this.utilsService.parseDatetimeStr(
              new Date()
            )}.csv`
          : `compliance_${this.utilsService.parseDatetimeStr(new Date())}.csv`;
      saveAs(blob, filename);
    }
  }
}
