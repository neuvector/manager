import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GroupsService } from '@services/groups.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';

@Component({
  standalone: false,
  selector: 'app-monitor-metric-switch',
  templateUrl: './monitor-metric-switch.component.html',
  styleUrls: ['./monitor-metric-switch.component.scss'],
})
export class MonitorMetricSwitchComponent implements ICellRendererAngularComp {
  params: ICellRendererParams;
  showMonitorMetric: Boolean = false;
  isReadonlyGroup: Boolean = false;
  isAddressGroupAndNamespaceUser: Boolean = false;

  constructor(
    private groupsService: GroupsService,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.showMonitorMetric =
      (this.params.data.cfg_type === GlobalConstant.CFG_TYPE.LEARNED ||
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.CUSTOMER ||
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.GROUND ||
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.FED) &&
      this.params.data.kind === MapConstant.GROUP_KIND.CONTAINER &&
      !this.params.data.reserved;
    this.isReadonlyGroup =
      params.data.cfg_type === GlobalConstant.CFG_TYPE.GROUND ||
      (this.params.context.componentParent.source ===
      GlobalConstant.NAV_SOURCE.FED_POLICY
        ? false
        : params.data.cfg_type === GlobalConstant.CFG_TYPE.FED);
    this.isAddressGroupAndNamespaceUser =
      this.params.context.componentParent.isNamespaceUser &&
      params.data.kind.toLowerCase() === MapConstant.GROUP_KIND.ADDRESS;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  toggleMonitoMetric = isEnabled => {
    let payload = {
      name: this.params.data.name,
      criteria: this.params.data.criteria,
      comment: this.params.data.comment,
      group_sess_rate: this.params.data.group_sess_rate,
      group_sess_cur: this.params.data.group_sess_cur,
      group_band_width: this.params.data.group_band_width,
      cfg_type: this.params.data.cfg_type,
      monitor_metric: isEnabled,
    };
    this.groupsService
      .insertUpdateGroupData(payload, GlobalConstant.MODAL_OP.EDIT)
      .subscribe(
        response => {
          let msgTitle = isEnabled
            ? this.translate.instant('group.TIP.ENABLE_MONITOR_METRIC')
            : this.translate.instant('group.TIP.DISABLE_MONITOR_METRIC');
          this.notificationService.open(msgTitle);
          let index = this.params.context.componentParent.groups.findIndex(
            group => group.name === this.params.data.name
          );
          this.params.context.componentParent.groups[index].monitor_metric =
            isEnabled;
          this.params.context.componentParent.renderGroups(
            this.params.context.componentParent.groups,
            { isHardReloaded: false }
          );
        },
        error => {
          let msgTitle = this.translate.instant('group.editGroup.ERR_MSG');
          this.notificationService.openError(error.error, msgTitle);
        }
      );
  };
}
