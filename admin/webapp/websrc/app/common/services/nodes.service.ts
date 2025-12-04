import { Injectable } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { Host } from '@common/types';
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
    private risksHttpService: RisksHttpService
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
}
