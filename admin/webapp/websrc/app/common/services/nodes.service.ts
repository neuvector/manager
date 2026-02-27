import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { Host, VulnerabilitiesQuery } from '@common/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class NodesService {
  private _nodes: Host[] = [];
  get nodes() {
    return this._nodes;
  }
  set nodes(nodes: Host[]) {
    this._nodes = nodes;
  }

  constructor(
    private assetsHttpService: AssetsHttpService,
    private risksHttpService: RisksHttpService,
    private datePipe: DatePipe
  ) {}

  resetNodes(): void {
    this.nodes = [];
  }

  getNodes(): Observable<Host[]> {
    return this.assetsHttpService.getNodeBrief().pipe(map(r => r.hosts));
  }

  getNodeContainers(id: string) {
    return this.assetsHttpService.getNodeWorkloads(id);
  }

  getNodeCompliance(id: string) {
    return this.risksHttpService.getNodeCompliance(id);
  }

  getNodesVulnerabilities(payload: VulnerabilitiesQuery) {
    return this.risksHttpService.getNodesVulnerabilities(payload);
  }

  formatVulnerabilitiesToCSV(vulnerabilities: any[]): string {
    if (!vulnerabilities || vulnerabilities.length === 0) {
      return '';
    }

    const header = [
      'host_name',
      'name',
      'link',
      'severity',
      'score',
      'score_v3',
      'package_name',
      'package_version',
      'fixed_version',
      'description',
      'feed_rating',
      'file_name',
      'vectors',
      'vectors_v3',
      'in_base_image',
      'tags',
      'published_timestamp',
      'last_modified_timestamp',
    ].join(',');

    const csvRows = vulnerabilities.map(vul => {
      const host_name = vul.host_name || '';
      const name = vul.name || '';
      const link = vul.link || '';
      const severity = vul.severity || '';
      const score = vul.score !== undefined ? vul.score : '';
      const score_v3 = vul.score_v3 !== undefined ? vul.score_v3 : '';
      const package_name = vul.package_name || '';
      const package_version = vul.package_version || '';
      const fixed_version = vul.fixed_version || '';
      const description = vul.description
        ? `"${vul.description.replace(/"/g, '""')}"`
        : '';
      const feed_rating = vul.feed_rating || '';
      const file_name = vul.file_name || '';
      const vectors = vul.vectors ? `"${vul.vectors.replace(/"/g, '""')}"` : '';
      const vectors_v3 = vul.vectors_v3
        ? `"${vul.vectors_v3.replace(/"/g, '""')}"`
        : '';
      const in_base_image =
        vul.in_base_image !== undefined ? vul.in_base_image : '';
      const tags = vul.tags ? `"${vul.tags.join(', ')}"` : '';
      const published_timestamp = vul.published_timestamp
        ? `${this.datePipe.transform(vul.published_timestamp, 'MMM dd y HH:mm:ss')}`
        : '';
      const last_modified_timestamp = vul.last_modified_timestamp
        ? `${this.datePipe.transform(vul.last_modified_timestamp, 'MMM dd y HH:mm:ss')}`
        : '';

      return [
        host_name,
        name,
        link,
        severity,
        score,
        score_v3,
        package_name,
        package_version,
        fixed_version,
        description,
        feed_rating,
        file_name,
        vectors,
        vectors_v3,
        in_base_image,
        tags,
        published_timestamp,
        last_modified_timestamp,
      ].join(',');
    });
    return [header, ...csvRows].join('\n');
  }
}
