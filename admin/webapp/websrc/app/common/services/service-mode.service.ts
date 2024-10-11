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
  profileMode?: PolicyMode;
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
    mode: PolicyMode,
    profileMode: PolicyMode,
  ) {
    const nodesGroup = selectedGroups.find(group => group.name === 'nodes');
    if (nodesGroup) {
      const isMultipleSelected = selectedGroups.length > 1;
      if (forAll) {
        this.selectNodesAlert(
          (isAlerted: boolean) => {
            if (!isAlerted) {
              this.switchAllAlert(selectedGroups, mode, profileMode);
            } else {
              this.switchAll(mode, profileMode);
            }
          },
          mode,
          profileMode,
          nodesGroup,
          isMultipleSelected
        );
      } else {
        this.selectNodesAlert(
          (isAlerted: boolean) => {
            if (!isAlerted) {
              this.switchSomeAlert(selectedGroups, mode, profileMode);
            } else {
              this.switchSome(selectedGroups, mode, profileMode);
            }
          },
          mode,
          profileMode,
          nodesGroup,
          isMultipleSelected
        );
      }
    } else {
      this.switchSomeAlert(selectedGroups, mode, profileMode);
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
    profileMode: PolicyMode,
    nodesGroup: Group,
    isMultipleSelected: boolean
  ) {
    if (!this.suppressShowNodesAlerts(mode, profileMode, nodesGroup, isMultipleSelected)) {
      const mode4Msg = mode || profileMode;
      const message = this.getMessage4NodesSelected(mode4Msg);
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

  private switchAll(mode: PolicyMode, profileMode: PolicyMode) {
    this.groupsService.updateMode4All(mode, profileMode, 'no-change').subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('service.ALL_SUBMIT_OK'));
        this.refreshEventSubject$.next({
          all: true,
          mode: mode,
          profileMode: profileMode,
        });
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.tr.instant('service.ALL_SUBMIT_FAILED')
        );
      },
    });
  }

  private switchAllAlert(selectedGroups: Group[], mode: PolicyMode, profileMode: PolicyMode) {
    if (!this.suppressSwitchMode(selectedGroups, mode, profileMode)) {
      const mode4Msg = mode || profileMode;
      const message = this.getMessage(mode4Msg);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.switchAll(mode, profileMode);
        }
      });
    }
  }

  private switchBaseline(selectedGroups: Group[], baseline: ProfileBaseline) {
    this.groupsService
      .updateModeByService('', '', baseline, selectedGroups)
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
          this.notificationService.openError(
            error,
            this.tr.instant('service.BASELINE_PROFILE_SUBMIT_FAILED')
          );
        },
      });
  }

  private switchSome(selectedGroups: Group[], mode: PolicyMode, profileMode: PolicyMode) {
    this.groupsService
      .updateModeByService(mode, profileMode, 'no-change', selectedGroups)
      .subscribe({
        complete: () => {
          this.notificationService.open(
            this.tr.instant('service.ALL_SUBMIT_OK')
          );
          selectedGroups.forEach(g => {
            g.policy_mode = mode || g.policy_mode;
            g.profile_mode = profileMode || g.profile_mode;
          });
          this.refreshEventSubject$.next({
            all: false,
          });
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('service.ALL_SUBMIT_FAILED')
          );
        },
      });
  }

  private switchSomeAlert(selectedGroups: Group[], mode: PolicyMode, profileMode: PolicyMode) {
    if (!this.suppressSwitchMode(selectedGroups, mode, profileMode)) {
      const mode4Msg = mode || profileMode;
      const message = this.getMessage(mode4Msg);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.switchSome(selectedGroups, mode, profileMode);
        }
      });
    }
  }

  private suppressSwitchMode(selectedGroups: Group[], mode: PolicyMode, profileMode: PolicyMode) {
    if (mode) {
      const modeCountMap = {
        discover: 0,
        monitor: 0,
        protect: 0,
        '': 0,
      };
      selectedGroups.forEach(group => {
        if (group.cap_change_mode) {
          modeCountMap[(group.policy_mode || '').toLowerCase()]++;
        }
      });
      let areAllGroupsInSameTargetMode =
        modeCountMap[mode.toLowerCase()] ===
        Object.values(modeCountMap).reduce(
          (accumulator, currentValue) => accumulator + currentValue
        );
      return areAllGroupsInSameTargetMode;
    } else {
      const profileModeCountMap = {
        discover: 0,
        monitor: 0,
        protect: 0,
        '': 0,
      };
      selectedGroups.forEach(group => {
        if (group.cap_change_mode) {
          profileModeCountMap[(group.profile_mode || '').toLowerCase()]++;
        }
      });
      let areAllGroupsInSameTargetMode =
        profileModeCountMap[profileMode.toLowerCase()] ===
        Object.values(profileModeCountMap).reduce(
          (accumulator, currentValue) => accumulator + currentValue
        );
      return areAllGroupsInSameTargetMode;
    }
  }

  private suppressShowNodesAlerts(
    mode: PolicyMode,
    profileMode: PolicyMode,
    nodesGroup: Group,
    isMultipleSelected: boolean
  ) {
    if (mode) {
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
      return isSwitchingSameMode ||
        isDowngradingMode ||
        !isMultipleSelected;
    } else {
      const policyModeGradeMap = {
        discover: 0,
        monitor: 1,
        protect: 2,
      };
      let currProfileMode = nodesGroup.policy_mode?.toLowerCase();
      let targetProfileMode = profileMode.toLowerCase();
      let isSwitchingSameProfileMode = currProfileMode === targetProfileMode;
      let isDowngradingProfileMode = policyModeGradeMap[targetProfileMode] === 0;
      console.log(
        'isSwitchingSameProfileMode: ',
        isSwitchingSameProfileMode,
        'isDowngradingProfileMode: ',
        isDowngradingProfileMode
      );
      return isSwitchingSameProfileMode ||
        isDowngradingProfileMode ||
        !isMultipleSelected;
    }
  }

  private getMessage4NodesSelected(mode: PolicyMode) {
    return (
      this.tr.instant('group.SELECT_ALL_ALERT') +
      this.tr.instant('enum.' + mode.toUpperCase()) +
      this.tr.instant('group.MODE_NODES')
    );
  }

  private getMessage(mode: PolicyMode) {
    return (
      this.tr.instant('topbar.mode.SWITCH') +
      this.tr.instant('enum.' + mode.toUpperCase()) +
      this.tr.instant('topbar.mode.MODE') +
      '?'
    );
  }
}
