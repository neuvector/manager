import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { RisksHttpService } from '@common/api/risks-http.service';
import { MapConstant } from '@common/constants/map.constant';
import { Workload, WorkloadChildV2, WorkloadV2 } from '@common/types';
import { WorkloadBrief } from '@common/types/compliance/workloadBrief';
import { UtilsService } from '@common/utils/app.utils';
import {
  briefToV2,
  filterExitWorkloads,
  filterExitWorkloadsV2,
  workloadToV2,
} from '@common/utils/common.utils';
import { Observable, range } from 'rxjs';
import { concatMap, delay, map, repeatWhen, takeWhile } from 'rxjs/operators';

export type WorkloadRow = WorkloadChildV2 & {
  parent_id?: string;
  parent_data?: string;
  child_ids?: string[];
  child_data?: string;
  visible: boolean;
};

export interface NodeOptions {
  systemNode: boolean;
  exitNode: boolean;
}

@Injectable()
export class ContainersService {
  private _containers: WorkloadV2[] = [];
  private _quarantinedContainers: WorkloadV2[] = [];
  private _displayContainers: WorkloadRow[] = [];
  get containers() {
    return this._containers;
  }
  get displayContainers() {
    return this._displayContainers;
  }
  get quarantinedContainers() {
    this._quarantinedContainers = this._containers.filter(
      w => w.brief.state == 'quarantined'
    );
    return this._quarantinedContainers;
  }
  set displayContainers(display_containers: WorkloadRow[]) {
    this._displayContainers = display_containers;
  }

  constructor(
    private assetsHttpService: AssetsHttpService,
    private risksHttpService: RisksHttpService,
    private datePipe: DatePipe,
    private utils: UtilsService
  ) {}

  addContainers(containers: WorkloadV2[]) {
    this._containers = this._containers.concat(containers);
  }

  addDisplayContainers(displayContainers: WorkloadRow[]) {
    this._displayContainers = this._displayContainers.concat(displayContainers);
  }

  resetContainers() {
    this._containers = [];
    this._displayContainers = [];
  }

  getIps(interfaces) {
    let ips = '';
    for (let key in interfaces) {
      if (interfaces.hasOwnProperty(key)) {
        ips += interfaces[key].reduce((result, ip) => result + ip.ip + ',', '');
      }
    }
    return ips;
  }

  getContainerCompliance(id: string) {
    return this.risksHttpService.getContainerCompliance(id);
  }

  startContainerStats(id: string) {
    return this.assetsHttpService.getContainerStats(id).pipe(
      map(statsData => this.utils.parseContainerStats(statsData)),
      repeatWhen(res => res.pipe(delay(5000)))
    );
  }

  getContainerProcess(id: string, showProcessHistory: boolean) {
    return showProcessHistory
      ? this.assetsHttpService.getProcessHistory(id)
      : this.assetsHttpService.getProcess(id);
  }

  getContainers(): Observable<Workload[]> {
    return this.assetsHttpService.getContainers();
  }

  getScannedContainers(): Observable<WorkloadV2[]> {
    return range(0, 1000).pipe(
      map(x => x * MapConstant.PAGE.CONTAINERS),
      concatMap(x =>
        this.assetsHttpService.getScannedContainers(
          x,
          MapConstant.PAGE.CONTAINERS
        )
      ),
      takeWhile(res => res.length === MapConstant.PAGE.CONTAINERS, true)
    );
  }

  checkDuplicates(workloads: WorkloadRow[]) {
    /* To be removed - API should never send duplicate id workloads */
    const node_ids = workloads.map(w => w.brief.id);
    const duplicate_ids = node_ids.filter(
      (item, index) => node_ids.indexOf(item) != index
    );
    workloads.forEach(w => {
      if (duplicate_ids.includes(w.brief.id)) {
        console.warn(`Duplicate workload id=${w.brief.id} found: ${w}`);
      }
    });
  }

  formatScannedContainers(containers: WorkloadV2[]): WorkloadRow[] {
    let res: WorkloadRow[] = [];
    containers.forEach(workload => {
      let { children, ...parent } = workload;
      const parent_id = parent.brief.id;
      const parent_data = JSON.stringify(parent);
      const child_ids = children.map(c => c.brief.id);
      const child_data = JSON.stringify(children);
      res.push({ ...parent, child_ids, child_data, visible: true });
      children.forEach(workloadChild => {
        res.push({ ...workloadChild, parent_id, parent_data, visible: true });
      });
    });
    this.checkDuplicates(res);
    return res;
  }

  formatScannedWorkloads(workloads: Workload[]): WorkloadRow[] {
    let res: WorkloadRow[] = [];
    workloads.forEach(workload => {
      let { children, ...parent } = workload;
      const parent_id = parent.id;
      const parent_data = JSON.stringify(parent);
      const child_ids = children.map(c => c.id);
      const child_data = JSON.stringify(children);
      res.push({
        ...workloadToV2(workload),
        child_ids,
        child_data,
        visible: true,
      });
      children.forEach(workloadChild => {
        res.push({
          ...briefToV2(workloadChild),
          parent_id,
          parent_data,
          visible: true,
        });
      });
    });
    this.checkDuplicates(res);
    return res;
  }

  getDisplayParents(workloads: WorkloadRow[]) {
    return workloads.filter(w => !w.parent_id);
  }

  filterNode(showSystem: boolean, containers: WorkloadV2[]) {
    const filtered = showSystem
      ? containers
      : containers.filter(w => !w.platform_role);
    return this.formatScannedContainers(filterExitWorkloadsV2(filtered));
  }

  filterWorkload(showSystem: boolean, workloads: Workload[]) {
    const filtered = showSystem
      ? workloads
      : workloads.filter(w => !w.platform_role);
    return this.formatScannedWorkloads(filterExitWorkloads(filtered));
  }

  makeWorkloadCSVData(containers: Workload[]) {
    let workloadsCsvData = [] as any;
    containers.forEach(workload => {
      workloadsCsvData.push(this.makeWorkloadData(workload, false));
      if (workload.children && workload.children.length > 0) {
        workload.children.forEach(workload => {
          workloadsCsvData.push(this.makeWorkloadData(workload, true));
        });
      }
    });
    return workloadsCsvData;
  }

  private makeWorkloadData(w: Workload | WorkloadBrief, isChild: boolean) {
    let workload = w as Workload;
    return {
      layer: isChild ? '      Children' : 'Parent',
      id: workload.id,
      display_name: workload.display_name,
      namespace: workload.domain,
      host_name: workload.host_name,
      image: workload.image,
      applications: workload.applications
        ? `'${workload.applications.join(', ')}'`
        : '',
      service_group: workload.service_group,
      network_mode: workload.network_mode,
      enforcer_name: workload.enforcer_name,
      privileged: workload.privileged,
      interfaces: workload.interfaces
        ? `'${Object.entries(workload.interfaces).map(([key, value]) => {
            //IP: ${value.ip}/${value.ip_prefix}, Gateway: ${value.gateway ? value.gateway : ""}
            return `${key} -> ${value
              .map(ipInfo => {
                return `IP: ${ipInfo.ip}/${ipInfo.ip_prefix}, Gateway: ${
                  ipInfo.gateway ? ipInfo.gateway : 'None'
                }`;
              })
              .join(', ')}`;
          })}'`
        : '',
      ports: workload.ports
        ? `'${workload.ports
            .map(port => {
              return `${port.host_ip}:${port.host_port} -> ${
                port.ip_proto === 6 ? 'TCP' : 'UDP'
              }/${port.port}`;
            })
            .join(', ')}'`
        : '',
      labels: workload.labels
        ? `'${Object.entries(workload.labels)
            .map(([key, value]) => {
              return `${key}: ${value}`;
            })
            .join(', ')}'`
        : '',
      vulnerability: workload.scan_summary
        ? `'Medium: ${workload.scan_summary.medium}, High: ${workload.scan_summary.high}'`
        : '',
      state: workload.state,
      started_at: `'${this.datePipe.transform(
        workload.started_at,
        'MMM dd, y HH:mm:ss'
      )}'`,
    };
  }
}
