import { Injectable } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import {
  Host,
  Platform,
  ScanConfig,
  VulnerabilityProfile,
  WorkloadV2,
} from '@common/types';
import { WorkloadRow } from './containers.service';

@Injectable()
export class ScanService {
  constructor(
    private assetsHttpService: AssetsHttpService,
    private risksHttpService: RisksHttpService
  ) {}

  getScanConfig() {
    return this.assetsHttpService.getScanConfig();
  }

  postScanConfig(config: ScanConfig) {
    return this.assetsHttpService.postScanConfig(config);
  }

  getContainerVuls(id: string, isShowingAccepted: boolean) {
    return this.assetsHttpService.getWorkloadReport(id, isShowingAccepted);
  }

  getNodeVuls(id: string, isShowingAccepted: boolean) {
    return this.assetsHttpService.getHostReport(id, isShowingAccepted);
  }

  getPlatformVuls(platform: string, isShowingAccepted: boolean) {
    return this.assetsHttpService.getPlatformReport(
      platform,
      isShowingAccepted
    );
  }

  isScanWorkloadsFinished(workloads: WorkloadV2[]): boolean {
    if (!workloads) return true;
    return (
      workloads
        .filter(w => w.brief.state !== 'exit')
        .findIndex(w => !this.isContainerScanFinished(w)) < 0
    );
  }

  isScanNodesFinished(nodes: Host[]): boolean {
    if (!nodes) return true;
    return nodes.findIndex(n => !this.isNodeScanFinished(n)) < 0;
  }

  isScanPlatformsFinished(platforms: Platform[]): boolean {
    if (!platforms) return true;
    return platforms.findIndex(p => !this.isPlatformScanFinished(p)) < 0;
  }

  isContainerScanFinished(workload: WorkloadRow | WorkloadV2): boolean {
    return ['finished', 'failed', ''].includes(
      workload.security.scan_summary.status
    );
  }

  isNodeScanFinished(node: Host): boolean {
    return ['finished', 'failed', ''].includes(node.scan_summary.status);
  }

  isPlatformScanFinished(platform: Platform): boolean {
    return ['finished', 'failed', ''].includes(platform.status);
  }

  scanContainer(id: string) {
    return this.assetsHttpService.postScanContainer(id);
  }

  scanNode(id: string) {
    return this.assetsHttpService.postScanNode(id);
  }

  scanPlatform(id: string) {
    return this.assetsHttpService.postScanPlatform(id);
  }

  acceptVulnerability(profile: VulnerabilityProfile) {
    return this.risksHttpService.postCVEProfile(profile);
  }
}
