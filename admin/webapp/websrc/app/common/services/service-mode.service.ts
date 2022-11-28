import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ErrorResponse,
  Group,
  PolicyMode,
  ProfileBaseline,
} from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { GroupsService } from './groups.service';
import { NotificationService } from './notification.service';

export interface RefreshEvent {
  all: boolean;
  mode?: PolicyMode;
  baseline?: ProfileBaseline;
}

@Injectable()
export class ServiceModeService {
  private refreshEventSubject$ = new BehaviorSubject<RefreshEvent | undefined>(
    undefined
  );
  refreshEvent$ = this.refreshEventSubject$.asObservable();

  constructor(
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private tr: TranslateService,
    private utils: UtilsService
  ) {}

  switchServiceMode(
    selectedGroups: Group[],
    forAll: boolean,
    mode: PolicyMode
  ) {
    const nodesGroup = selectedGroups.find(group => group.name === 'nodes');
    if (nodesGroup) {
      const isMultipleSelected = selectedGroups.length > 1;
      if (forAll) {
        this.selectNodesAlert(
          (isAlerted: boolean) => {
            if (!isAlerted) {
              this.switchAllAlert(selectedGroups, mode);
            } else {
              this.switchAll(mode);
            }
          },
          mode,
          nodesGroup,
          isMultipleSelected
        );
      } else {
        this.selectNodesAlert(
          (isAlerted: boolean) => {
            if (!isAlerted) {
              this.switchSomeAlert(selectedGroups, mode);
            } else {
              this.switchSome(selectedGroups, mode);
            }
          },
          mode,
          nodesGroup,
          isMultipleSelected
        );
      }
    } else {
      this.switchSomeAlert(selectedGroups, mode);
    }
  }

  switchBaselineProfile(selectedGroups: Group[], baseline: ProfileBaseline) {
    const nodesGroup = selectedGroups.find(group => group.name === 'nodes');
    if (nodesGroup) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: this.tr.instant('service.BASELINE_PROFILE_WARNING'),
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.switchBaseline(selectedGroups, baseline);
        }
      });
    } else {
      this.switchBaseline(selectedGroups, baseline);
    }
  }

  private selectNodesAlert(
    cb: (isAlerted: boolean) => void,
    mode: PolicyMode,
    nodesGroup: Group,
    isMultipleSelected: boolean
  ) {
    if (!this.suppressShowNodesAlerts(mode, nodesGroup, isMultipleSelected)) {
      const message = this.getMessage4NodesSelected(mode);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          cb(true);
        }
      });
    } else {
      cb(false);
    }
  }

  private switchAll(mode: PolicyMode) {
    this.groupsService.updateMode4All(mode, 'no-change').subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('service.ALL_SUBMIT_OK'));
        this.refreshEventSubject$.next({
          all: true,
          mode: mode,
        });
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.open(
          this.utils.getAlertifyMsg(
            error,
            this.tr.instant('service.ALL_SUBMIT_FAILED'),
            false
          )
        );
      },
    });
  }

  private switchAllAlert(selectedGroups: Group[], mode: PolicyMode) {
    if (!this.suppressSwitchMode(selectedGroups, mode)) {
      const message = this.getMessage(mode);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.switchAll(mode);
        }
      });
    }
  }

  private switchBaseline(selectedGroups: Group[], baseline: ProfileBaseline) {
    this.groupsService
      .updateModeByService('', baseline, selectedGroups)
      .subscribe({
        complete: () => {
          this.notificationService.open(
            this.tr.instant('service.BASELINE_PROFILE_SUBMIT_OK')
          );
          selectedGroups.forEach(g => (g.baseline_profile = baseline));
          this.refreshEventSubject$.next({
            all: false,
          });
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              error,
              this.tr.instant('service.BASELINE_PROFILE_SUBMIT_FAILED'),
              false
            )
          );
        },
      });
  }

  private switchSome(selectedGroups: Group[], mode: PolicyMode) {
    this.groupsService
      .updateModeByService(mode, 'no-change', selectedGroups)
      .subscribe({
        complete: () => {
          this.notificationService.open(
            this.tr.instant('service.ALL_SUBMIT_OK')
          );
          selectedGroups.forEach(g => (g.policy_mode = mode));
          this.refreshEventSubject$.next({
            all: false,
          });
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              error,
              this.tr.instant('service.ALL_SUBMIT_FAILED'),
              false
            )
          );
        },
      });
  }

  private switchSomeAlert(selectedGroups: Group[], mode: PolicyMode) {
    if (!this.suppressSwitchMode(selectedGroups, mode)) {
      const message = this.getMessage(mode);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.switchSome(selectedGroups, mode);
        }
      });
    }
  }

  private suppressSwitchMode(selectedGroups: Group[], mode: PolicyMode) {
    let modeCountMap = {
      discover: 0,
      monitor: 0,
      protect: 0,
      '': 0,
    };
    selectedGroups.forEach(group => {
      if (group.cap_change_mode)
        modeCountMap[(group.policy_mode || '').toLowerCase()]++;
    });
    let areAllGroupsInSameTargetMode =
      modeCountMap[mode.toLowerCase()] ===
      Object.values(modeCountMap).reduce(
        (accumulator, currentValue) => accumulator + currentValue
      );
    return areAllGroupsInSameTargetMode;
  }

  private suppressShowNodesAlerts(
    mode: PolicyMode,
    nodesGroup: Group,
    isMultipleSelected: boolean
  ) {
    const modeGradeMap = {
      discover: 0,
      monitor: 1,
      protect: 2,
    };
    let currMode = nodesGroup.policy_mode?.toLowerCase();
    let targetMode = mode.toLowerCase();
    let isSwitchingSameMode = currMode === targetMode;
    let isDowngradingMode = modeGradeMap[targetMode] === 0;
    console.log(
      'isSwitchingSameMode: ',
      isSwitchingSameMode,
      'isDowngradingMode: ',
      isDowngradingMode
    );
    return isSwitchingSameMode || isDowngradingMode || !isMultipleSelected;
  }

  private getMessage4NodesSelected(id: PolicyMode) {
    return (
      this.tr.instant('group.SELECT_ALL_ALERT') +
      this.tr.instant('enum.' + id.toUpperCase()) +
      this.tr.instant('group.MODE_NODES')
    );
  }

  private getMessage(id: PolicyMode) {
    return (
      this.tr.instant('topbar.mode.SWITCH') +
      this.tr.instant('enum.' + id.toUpperCase()) +
      this.tr.instant('topbar.mode.MODE') +
      '?'
    );
  }
}
