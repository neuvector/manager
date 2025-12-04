import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { GlobalConstant } from '@common/constants/global.constant';
import { GroupsService } from '@services/groups.service';
import { Group } from '@common/types';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';


@Component({
  standalone: false,
  selector: 'app-switch-mode-modal',
  templateUrl: './switch-mode-modal.component.html',
  styleUrls: ['./switch-mode-modal.component.scss'],
  
})
export class SwitchModeModalComponent implements OnInit {
  submittingUpdate: boolean = false;
  mode: string;
  profileMode: string;
  baselineProfile: string;
  zeroDriftHint: string;
  noModeGroupList: Array<Group> = [];
  isExpandingGroupList: boolean = false;
  noModeGroupMsg: string = '';

  constructor(
    public dialogRef: MatDialogRef<SwitchModeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupsService: GroupsService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    let counts = this.getModeCounts();
    this.mode = this.getDefaultMode(counts.modeCount);
    this.profileMode = this.getDefaultMode(counts.profileModeCount);
    this.baselineProfile = this.getDefaultBaseline(counts.baselineCount);
    this.noModeGroupList = this.data.selectedGroups.filter(
      group => !group.cap_change_mode
    );
    this.noModeGroupMsg =
      this.noModeGroupList.length > 0
        ? this.translate.instant('group.SWITCH_MODE_DISABLED', {
            noModeGroupCount: this.noModeGroupList.length,
          })
        : '';
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  checkZeroDrift = () => {
    if (this.zeroDriftHint) return;
    this.zeroDriftHint = '';
    if (
      (this.baselineProfile === 'basic' ||
        this.baselineProfile === 'no-change') &&
      this.mode !== 'discover'
    ) {
      this.zeroDriftHint = this.translate.instant('group.ZERO_DRIFT_HINT');
      this.mode = 'discover';
      this.profileMode = 'discover';
    }
  };

  switchMode = () => {
    let isSwitchingAll =
      this.getSwitchableGroups(this.data.selectedGroups).length ===
      this.getSwitchableGroups(this.data.groups).length;
    let nodesGroup = this.data.selectedGroups.filter(
      group => group.name === 'nodes'
    );
    if (nodesGroup.length > 0) {
      if (isSwitchingAll) {
        this.selectNodesAlert(
          this.switchAllMode,
          this.mode,
          this.profileMode,
          this.baselineProfile,
          nodesGroup[0]
        );
      } else {
        this.selectNodesAlert(
          this.switchSomeMode,
          this.mode,
          this.profileMode,
          this.baselineProfile,
          nodesGroup[0]
        );
      }
    } else {
      this.switchSomeMode(
        this.mode,
        this.profileMode,
        this.baselineProfile,
        false
      );
    }
  };

  private getModeCounts = () => {
    let modeCountMap: Map<string, number> = new Map([
      ['discover', 0],
      ['monitor', 0],
      ['protect', 0],
    ]);
    let profileModeCountMap: Map<string, number> = new Map([
      ['discover', 0],
      ['monitor', 0],
      ['protect', 0],
    ]);
    let baselineCountMap: Map<string, number> = new Map([
      ['basic', 0],
      ['zero-drift', 0],
    ]);
    this.data.selectedGroups.forEach(group => {
      if (group.cap_change_mode) {
        modeCountMap.set(
          group.policy_mode.toLowerCase(),
          modeCountMap.get(group.policy_mode.toLowerCase())! + 1
        );
        profileModeCountMap.set(
          group.profile_mode.toLowerCase(),
          profileModeCountMap.get(group.profile_mode.toLowerCase())! + 1
        );
        baselineCountMap.set(
          group.baseline_profile.toLowerCase(),
          baselineCountMap.get(group.baseline_profile.toLowerCase())! + 1
        );
      }
    });
    return {
      modeCount: modeCountMap,
      profileModeCount: profileModeCountMap,
      baselineCount: baselineCountMap,
    };
  };

  private getDefaultMode = (modeCount: Map<string, number>) => {
    let countSum = Array.from(modeCount.values()).reduce((a, b) => a + b);
    if (countSum == 0) return '';
    if (modeCount.get('monitor') == countSum) return 'monitor';
    if (modeCount.get('protect') == countSum) return 'protect';
    if (modeCount.get('discover') == countSum) return 'discover';
    else return '';
  };

  private getDefaultBaseline = (baselineCount: Map<string, number>) => {
    if (
      baselineCount.get('zero-drift') !== 0 &&
      baselineCount.get('basic') === 0
    ) {
      return 'zero-drift';
    } else if (
      baselineCount.get('zero-drift') === 0 &&
      baselineCount.get('basic') !== 0
    ) {
      return 'basic';
    } else {
      return 'no-change';
    }
  };

  private getSwitchableGroups = groups => {
    return groups.filter(group => group.cap_change_mode);
  };

  private selectNodesAlert = (
    cb: Function,
    mode: string,
    profileMode: string,
    baselineProfile: string,
    nodesGroup: Group
  ) => {
    if (!this.suppressShowNodesAlerts(mode, nodesGroup)) {
      let message = this.getMessage(mode, baselineProfile, true);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          cb(mode, profileMode, baselineProfile, true);
        }
      });
    } else {
      cb(mode, profileMode, baselineProfile);
    }
  };

  private switchSomeMode = (
    mode: string,
    profileMode: string,
    baselineProfile: string,
    isAlerted: boolean
  ) => {
    const execSwitch = () => {
      let switchableGroups = this.getSwitchableGroups(this.data.selectedGroups);
      this.submittingUpdate = true;
      this.groupsService
        .updateModeByService(
          mode,
          profileMode,
          baselineProfile,
          switchableGroups
        )
        .subscribe(
          response => {
            this.notificationService.open(
              this.translate.instant('service.SUBMIT_OK')
            );
            setTimeout(() => {
              this.data.refresh();
            }, 1000);
            this.dialogRef.close(true);
            this.submittingUpdate = false;
          },
          error => {
            this.notificationService.openError(
              error.error,
              this.translate.instant('service.SUBMIT_FAILED')
            );
            this.submittingUpdate = false;
          }
        );
    };
    if (isAlerted) {
      execSwitch();
    } else {
      let message = this.getMessage(mode, baselineProfile, false);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
          isSync: true,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          execSwitch();
        }
      });
    }
  };

  private switchAllMode = (
    mode: string,
    profileMode: string,
    baselineProfile: string
  ) => {
    this.submittingUpdate = true;
    this.groupsService
      .updateMode4All(mode, profileMode, baselineProfile)
      .subscribe(
        response => {
          this.notificationService.open(
            this.translate.instant('service.SUBMIT_OK')
          );
          setTimeout(() => {
            this.data.refresh();
          }, 1000);
          this.dialogRef.close(true);
          this.submittingUpdate = false;
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.translate.instant('service.SUBMIT_FAILED')
          );
          this.submittingUpdate = false;
        }
      );
  };

  private suppressShowNodesAlerts = (mode: string, nodesGroup: Group) => {
    const modeGradeMap: Map<string, number> = new Map([
      ['discover', 0],
      ['monitor', 1],
      ['protect', 2],
    ]);
    let currMode = nodesGroup.policy_mode!.toLowerCase();
    let targetMode = mode.toLowerCase();
    let isSwitchingSameMode = currMode === targetMode;
    let isDowngradingMode = modeGradeMap.get(targetMode) === 0;
    console.log(
      'isSwitchingSameMode: ',
      isSwitchingSameMode,
      'isDowngradingMode: ',
      isDowngradingMode
    );
    return (
      isSwitchingSameMode ||
      isDowngradingMode ||
      this.data.selectedGroups.length < 2
    );
  };

  private suppressSwitchMode = (mode: string, baselineProfile: string) => {
    let countsMaps = this.getModeCounts();
    let areAllGroupsInSameTargetMode =
      countsMaps.modeCount.get(mode.toLowerCase()) ===
      Array.from(countsMaps.modeCount.values()).reduce(
        (accumulator, currentValue) => accumulator + currentValue
      );
    let areAllGroupsInSameTargetBaseline =
      countsMaps.baselineCount.get(baselineProfile.toLowerCase()) ===
      Array.from(countsMaps.modeCount.values()).reduce(
        (accumulator, currentValue) => accumulator + currentValue
      );
    return areAllGroupsInSameTargetMode && areAllGroupsInSameTargetBaseline;
  };

  private getMessage = (
    mode: string,
    baselineProfile: string,
    hasNodeGroups: boolean = false
  ) => {
    let msgArray: Array<string> = [];
    if (mode !== '') {
      msgArray.push(
        `${this.translate.instant(
          'group.gridHeader.POLICY_MODE'
        )}: ${this.translate.instant('enum.' + mode.toUpperCase())}`
      );
    }
    if (baselineProfile !== 'no-change') {
      msgArray.push(
        `${this.translate.instant(
          'group.BASELINE_PROFILE'
        )}: ${this.translate.instant(
          'enum.' + baselineProfile.split('-').join('').toUpperCase()
        )}`
      );
    }
    return `${
      hasNodeGroups
        ? this.translate.instant('group.SELECT_ALL_ALERT')
        : this.translate.instant('topbar.mode.SWITCH_CONFIRM')
    } (${msgArray.join(', ')})`;
  };
}
