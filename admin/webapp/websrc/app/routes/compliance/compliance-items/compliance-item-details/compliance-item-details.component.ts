import { Component, OnDestroy } from '@angular/core';
import { ComplianceService } from '../../compliance.service';
import { Host, IdName, Workload } from '@common/types';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NodeBriefDialogComponent } from '@components/node-brief/node-brief-dialog/node-brief-dialog.component';
import { ContainerBriefDialogComponent } from '@components/container-brief/container-brief-dialog/container-brief-dialog.component';
import { take } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-compliance-item-details',
  templateUrl: './compliance-item-details.component.html',
  styleUrls: ['./compliance-item-details.component.scss'],
})
export class ComplianceItemDetailsComponent implements OnDestroy {
  selectedCompliance$ = this.complianceService.selectedCompliance$;
  legend = false;
  currentDialog!: MatDialogRef<any>;
  openDialog = false;

  constructor(
    private complianceService: ComplianceService,
    private dialog: MatDialog
  ) {}

  openNodeBrief(host: Host) {
    this.openDialog = true;
    this.currentDialog = this.dialog.open(NodeBriefDialogComponent, {
      width: '675px',
      position: { left: '25px', top: '130px' },
      hasBackdrop: false,
      data: host,
    });
    this.currentDialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => (this.openDialog = false));
  }

  openBrief(type: string, content: IdName) {
    if (type === 'node') {
      this.complianceService.getNodeBrief(content.id).subscribe({
        next: hostData => {
          if (this.openDialog) {
            this.currentDialog.close();
            this.currentDialog
              .afterClosed()
              .pipe(take(1))
              .subscribe(() => {
                this.openNodeBrief(hostData.host);
              });
          } else {
            this.openNodeBrief(hostData.host);
          }
        },
      });
    } else {
      this.complianceService.getContainerBrief(content.id).subscribe({
        next: workload => {
          let hasApps =
            workload.ports && Object.entries(workload.app_ports).length > 0;
          let apps;
          if (hasApps) {
            apps = Object.entries(workload.app_ports)
              .map(([k, v]) => {
                return `${k}/${v}`;
              })
              .join(', ');
          }
          const hasInterfaces =
            workload.interfaces &&
            Object.entries(workload.interfaces).length > 0;
          if (this.openDialog) {
            this.currentDialog.close();
            this.currentDialog
              .afterClosed()
              .pipe(take(1))
              .subscribe(() => {
                this.openContainerBrief(workload, hasApps, hasInterfaces, apps);
              });
          } else {
            this.openContainerBrief(workload, hasApps, hasInterfaces, apps);
          }
        },
      });
    }
  }

  openContainerBrief(
    workload: Workload,
    hasApps: boolean,
    hasInterfaces: boolean,
    apps: any
  ) {
    this.openDialog = true;
    this.currentDialog = this.dialog.open(ContainerBriefDialogComponent, {
      width: '800px',
      position: { left: '25px', top: '130px' },
      hasBackdrop: false,
      data: { workload, hasApps, hasInterfaces, apps },
    });
    this.currentDialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => (this.openDialog = false));
  }

  ngOnDestroy() {
    if (this.openDialog) {
      this.currentDialog.close();
    }
  }
}
