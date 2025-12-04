import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GroupsService } from '@services/groups.service';
import { GroupsComponent } from '@components/groups/groups.component';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { PathConstant } from '@common/constants/path.constant';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';


@Component({
  standalone: false,
  selector: 'app-groups-page',
  templateUrl: './groups-page.component.html',
  styleUrls: ['./groups-page.component.scss'],
  
})
export class GroupsPageComponent implements OnInit, AfterViewInit {
  public navSource!: string;
  public refresh!: Function;
  refreshing$ = new Subject();
  public isShowingSystemGroups: boolean = true;
  public netServiceStatus: boolean;
  public netServicePolicyModeValue!: string;
  public netServicePolicyMode!: string;
  public linkedGroup: string = '';
  @ViewChild(GroupsComponent) groupsView!: GroupsComponent;

  constructor(
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.linkedGroup = decodeURIComponent(params['group'] || '');
    });
  }

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.SELF;
    this.getConfig();
  }

  refreshing(isRefresh: boolean) {
    this.refreshing$.next(isRefresh);
  }

  ngAfterViewInit() {
    this.refresh = () => {
      this.getConfig();
      this.groupsView.getGroups();
    };
    this.cd.detectChanges();
  }

  toggleSystemGroup = () => {
    this.isShowingSystemGroups = !this.isShowingSystemGroups;
    if (!this.isShowingSystemGroups) {
      this.groupsView.groups = this.groupsView.groups.filter(function (item) {
        return !item.platform_role;
      });
      this.groupsView.gridApi!.setGridOption('rowData', this.groupsView.groups);
    } else {
      this.refresh();
    }
  };

  openImportGroupsDialog = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.IMPORT_GROUP_URL,
        importMsg: {
          success: this.translate.instant('group.IMPORT_OK'),
          error: this.translate.instant('setting.IMPORT_FAILED'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.refresh();
      }, 500);
    });
  };

  private getConfig = () => {
    this.groupsService.getConfigData().subscribe(
      response => {
        this.netServiceStatus = response.net_svc.net_service_status;
        this.netServicePolicyModeValue =
          response.net_svc.net_service_policy_mode.toLowerCase();
        this.netServicePolicyMode = this.translate.instant(
          `enum.${response.net_svc.net_service_policy_mode.toUpperCase()}`
        );
      },
      error => {}
    );
  };
}
